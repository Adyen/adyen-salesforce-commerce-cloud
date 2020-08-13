const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const { clearForms } = require('../../utils/index');

function authorize3ds2(req, res, next) {
  function handlePlaceOrderError(order) {
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

  function handleChallengeShopper(result) {
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

  function handlePaymentError(order, paymentInstrument) {
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

  function toggle3DS2Error() {
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

  function handleOrderConfirm(paymentInstrument, order, result) {
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

  function handlePlaceOrder(paymentInstrument, order, result) {
    // custom fraudDetection
    const fraudDetectionStatus = { status: 'success' };

    // Places the order
    const placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
      return handlePlaceOrderError(order);
    }

    return handleOrderConfirm(paymentInstrument, order, result);
  }

  function checkForSuccessfulPayment(result) {
    const hasError = result.error;
    const isAuthorised = result.resultCode === 'Authorised';
    const authorisedSuccessfully = !hasError && isAuthorised;
    const isChallengeShopper = result.resultCode === 'ChallengeShopper';

    return authorisedSuccessfully || isChallengeShopper;
  }

  function handlePaymentsCall(paymentDetailsRequest, order, paymentInstrument) {
    const result = adyenCheckout.doPaymentDetailsCall(paymentDetailsRequest);

    const isValid = checkForSuccessfulPayment(result);
    if (!isValid) {
      // Payment failed
      return handlePaymentError(order, paymentInstrument);
    }
    if (result.resultCode === 'ChallengeShopper') {
      // Redirect to ChallengeShopper
      return handleChallengeShopper(result);
    }

    // delete paymentData from requests
    Transaction.wrap(() => {
      paymentInstrument.custom.adyenPaymentData = null;
    });
    return handlePlaceOrder(paymentInstrument, order, result);
  }

  function hasFingerprint() {
    return (
      req.form.resultCode === 'IdentifyShopper' && req.form.fingerprintResult
    );
  }

  function hasChallengeResult() {
    return (
      req.form.resultCode === 'ChallengeShopper' && req.form.challengeResult
    );
  }

  function handle3DS2Authentication(session) {
    const order = OrderMgr.getOrder(session.privacy.orderNo);
    const paymentInstrument = order.getPaymentInstruments(
      session.privacy.paymentMethod,
    )[0];

    if (hasFingerprint()) {
      const paymentDetailsRequest = {
        paymentData: paymentInstrument.custom.adyenPaymentData,
        details: {
          'threeds2.fingerprint': req.form.fingerprintResult,
        },
      };

      return handlePaymentsCall(
        paymentDetailsRequest,
        order,
        paymentInstrument,
      );
    }
    const paymentDetailsRequest = {
      paymentData: paymentInstrument.custom.adyenPaymentData,
      details: {
        'threeds2.challengeResult': req.form.challengeResult,
      },
    };

    return handlePaymentsCall(paymentDetailsRequest, order, paymentInstrument);
  }
  function createAuthorization(session) {
    const is3DS2 = hasFingerprint() || hasChallengeResult();
    return is3DS2 ? handle3DS2Authentication(session) : toggle3DS2Error();
  }

  if (session.privacy.orderNo && session.privacy.paymentMethod) {
    try {
      return createAuthorization(session);
    } catch (e) {
      Logger.getLogger('Adyen').error(
        'Unable to retrieve order data from session 3DS2.',
      );
      res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
      return next();
    }
  }

  Logger.getLogger('Adyen').error('Session variables for 3DS2 do not exists');
  res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  return next();
}

module.exports = authorize3ds2;
