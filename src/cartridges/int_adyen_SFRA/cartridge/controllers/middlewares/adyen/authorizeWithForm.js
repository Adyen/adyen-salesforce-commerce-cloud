const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');
const { clearForms } = require('../../utils/index');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

function authorizeWithForm(req, res, next) {
  let paymentInstrument;
  let order;

  if (session.privacy.orderNo && session.privacy.paymentMethod) {
    try {
      order = OrderMgr.getOrder(session.privacy.orderNo);
      paymentInstrument = order.getPaymentInstruments(
        session.privacy.paymentMethod,
      )[0];
    } catch (e) {
      Logger.getLogger('Adyen').error(
        'Unable to retrieve order data from session.',
      );
      res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
      return next();
    }

    if (session.privacy.MD === req.form.MD) {
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
        Transaction.wrap(() => {
          OrderMgr.failOrder(order, true);
        });
        res.redirect(
          URLUtils.url(
            'Checkout-Begin',
            'stage',
            'payment',
            'paymentError',
            Resource.msg('error.payment.not.valid', 'checkout', null),
          ),
        );
        return next();
      }

      // custom fraudDetection
      const fraudDetectionStatus = { status: 'success' };

      // Places the order
      const placeOrderResult = COHelpers.placeOrder(
        order,
        fraudDetectionStatus,
      );
      if (placeOrderResult.error) {
        Transaction.wrap(() => {
          OrderMgr.failOrder(order, true);
        });
        res.redirect(
          URLUtils.url(
            'Checkout-Begin',
            'stage',
            'placeOrder',
            'paymentError',
            Resource.msg('error.payment.not.valid', 'checkout', null),
          ),
        );
        return next();
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
  }
  Logger.getLogger('Adyen').error('Session variable does not exists');
  res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  return next();
}

module.exports = authorizeWithForm;
