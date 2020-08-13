const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const { clearForms } = require('../../utils/index');

function authorizeWithForm(req, res, next) {
  function handleInvalidPayment(order, page) {
    Transaction.wrap(() => {
      OrderMgr.failOrder(order, true);
    });
    res.redirect(
      URLUtils.url(
        'Checkout-Begin',
        'stage',
        page,
        'paymentError',
        Resource.msg('error.payment.not.valid', 'checkout', null),
      ),
    );
    return next();
  }

  function handleGeneralError(msg) {
    Logger.getLogger('Adyen').error(msg);
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }

  function authorize(paymentInstrument, order) {
    const jsonRequest = {
      paymentData: paymentInstrument.custom.adyenPaymentData,
      details: {
        MD: req.form.MD,
        PaRes: req.form.PaRes,
      },
    };
    const result = adyenCheckout.doPaymentDetailsCall(jsonRequest);

    Transaction.wrap(() => {
      paymentInstrument.custom.adyenPaymentData = null;
    });
    // if error, return to checkout page
    if (result.error || result.resultCode !== 'Authorised') {
      return handleInvalidPayment(order, 'payment');
    }

    // custom fraudDetection
    const fraudDetectionStatus = { status: 'success' };

    // Places the order
    const placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
      return handleInvalidPayment(order, 'placeOrder');
    }

    Transaction.begin();
    AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
    order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
    order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
    Transaction.commit();
    COHelpers.sendConfirmationEmail(order, req.locale.id);
    clearForms();
    res.redirect(
      URLUtils.url(
        'Order-Confirm',
        'ID',
        order.orderNo,
        'token',
        order.orderToken,
      ).toString(),
    );
    return next();
  }

  function handleAuthorize() {
    const order = OrderMgr.getOrder(session.privacy.orderNo);
    const paymentInstrument = order.getPaymentInstruments(
      session.privacy.paymentMethod,
    )[0];

    if (session.privacy.MD === req.form.MD) {
      return authorize(paymentInstrument, order);
    }

    return handleGeneralError('Session variable does not exists');
  }

  if (session.privacy.orderNo && session.privacy.paymentMethod) {
    try {
      return handleAuthorize();
    } catch (e) {
      return handleGeneralError('Unable to retrieve order data from session.');
    }
  }
  return handleGeneralError('Session variable does not exists');
}

module.exports = authorizeWithForm;
