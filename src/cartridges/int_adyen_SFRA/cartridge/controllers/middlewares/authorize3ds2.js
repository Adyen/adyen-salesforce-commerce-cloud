const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');
const { clearForms } = require('../utils/index');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

function authorize3ds2(req, res, next) {
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
        'Unable to retrieve order data from session 3DS2.',
      );
      res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
      return next();
    }

    let details = {};
    if (
      req.form.resultCode === 'IdentifyShopper' &&
      req.form.fingerprintResult
    ) {
      details = {
        'threeds2.fingerprint': req.form.fingerprintResult,
      };
    } else if (
      req.form.resultCode === 'ChallengeShopper' &&
      req.form.challengeResult
    ) {
      details = {
        'threeds2.challengeResult': req.form.challengeResult,
      };
    } else {
      Logger.getLogger('Adyen').error('paymentDetails 3DS2 not available');
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

    const paymentDetailsRequest = {
      paymentData: paymentInstrument.custom.adyenPaymentData,
      details,
    };

    const result = adyenCheckout.doPaymentDetailsCall(paymentDetailsRequest);

    if (
      (result.error || result.resultCode !== 'Authorised') &&
      result.resultCode !== 'ChallengeShopper'
    ) {
      // Payment failed
      Transaction.wrap(() => {
        OrderMgr.failOrder(order, true);
        paymentInstrument.custom.adyenPaymentData = null;
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
    if (result.resultCode === 'ChallengeShopper') {
      // Redirect to ChallengeShopper
      res.redirect(
        URLUtils.url(
          'Adyen-Adyen3DS2',
          'resultCode',
          result.resultCode,
          'token3ds2',
          result.authentication['threeds2.challengeToken'],
        ),
      );
      return next();
    }

    // delete paymentData from requests
    Transaction.wrap(() => {
      paymentInstrument.custom.adyenPaymentData = null;
    });

    // custom fraudDetection
    const fraudDetectionStatus = { status: 'success' };

    // Places the order
    const placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
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

  Logger.getLogger('Adyen').error('Session variables for 3DS2 do not exists');
  res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  return next();
}

module.exports = authorize3ds2;
