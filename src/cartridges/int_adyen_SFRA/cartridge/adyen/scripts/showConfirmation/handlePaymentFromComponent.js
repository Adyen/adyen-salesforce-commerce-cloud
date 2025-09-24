const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const constants = require('*/cartridge/adyen/config/constants');
const clearForms = require('*/cartridge/adyen/utils/clearForms');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const postAuthorizationHook = require('*/cartridge/adyen/scripts/hooks/payment/postAuthorizationHandling');
const hooksHelper = require('*/cartridge/scripts/helpers/hooks');

const WALLET_PAYMENTS = ['amazonpay', 'applepay', 'googlepay', 'cashapp'];

function isWallet(result) {
  if (!result) return false;
  const resultString = JSON.stringify(result);
  return WALLET_PAYMENTS.some((wallet) => resultString.includes(wallet));
}

function handlePaymentError(order, adyenPaymentInstrument, { res, next }) {
  clearForms.clearAdyenData(adyenPaymentInstrument);
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

function handlePaymentsDetailsCall(stateData, adyenPaymentInstrument) {
  const { details, paymentData } = stateData;

  // redirect to payment/details
  const requestObject = {
    details,
    paymentData,
  };

  const result = adyenCheckout.doPaymentsDetailsCall(requestObject);
  return { result, adyenPaymentInstrument };
}

function handleAuthorisedPayment(
  order,
  result,
  adyenPaymentInstrument,
  { res, next },
) {
  Transaction.wrap(() => {
    AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
  });

  clearForms.clearAdyenData(adyenPaymentInstrument);
  clearForms.clearForms();
  // determines SFRA version for backwards compatibility
  if (AdyenConfigs.getAdyenSFRA6Compatibility() === true) {
    res.render('orderConfirmForm', {
      orderID: order.orderNo,
      orderToken: order.orderToken,
    });
  } else {
    res.redirect(
      URLUtils.url(
        'Order-Confirm',
        'ID',
        order.orderNo,
        'token',
        order.orderToken,
      ).toString(),
    );
  }
  return next();
}

function handlePaymentResult(result, order, adyenPaymentInstrument, options) {
  // Authorised: The payment authorisation was successfully completed.
  if (
    [
      constants.RESULTCODES.AUTHORISED,
      constants.RESULTCODES.PENDING,
      constants.RESULTCODES.RECEIVED,
    ].indexOf(result.resultCode) > -1
  ) {
    return handleAuthorisedPayment(
      order,
      result,
      adyenPaymentInstrument,
      options,
    );
  }
  Transaction.wrap(() => {
    order.custom.Adyen_pspReference = result.pspReference;
    order.custom.Adyen_eventCode = result.resultCode;
    order.custom.Adyen_paypalExpressResponse = null;
    adyenPaymentInstrument.custom.adyenPaymentData = null;
    session.privacy.paypalExpressOrderNo = null;
    session.privacy.pspReference = null;
  });
  return handlePaymentError(order, adyenPaymentInstrument, options);
}

function getFinalResult(order, stateData, result, adyenPaymentInstrument) {
  const hasStateData = stateData?.paymentData && stateData?.details;
  const paymentData = JSON.parse(
    adyenPaymentInstrument.custom.adyenPaymentData,
  );

  if (AdyenHelper.isPayPalExpress(paymentData.paymentMethod)) {
    return JSON.parse(order.custom.Adyen_paypalExpressResponse);
  }

  if (hasStateData) {
    const detailsCall = handlePaymentsDetailsCall(
      stateData,
      adyenPaymentInstrument,
    );
    return detailsCall?.result;
  }

  if (isWallet(result)) {
    return result;
  }

  return null;
}

function preparePayment(order, options) {
  const paymentInstruments = order.getPaymentInstruments(
    AdyenHelper.getOrderMainPaymentInstrumentType(order),
  );
  const adyenPaymentInstrument = paymentInstruments[0];
  const result = options.req.form?.result
    ? JSON.parse(options.req.form.result)
    : null;

  if (result?.error || order.status.value === Order.ORDER_STATUS_FAILED) {
    AdyenLogs.error_log(
      `Could not call payment/details for order ${order.orderNo}`,
    );
    return { error: true, adyenPaymentInstrument };
  }

  return { error: false, adyenPaymentInstrument, result };
}

function executePostAuthHook(order, stateData, finalResult) {
  return hooksHelper(
    'app.payment.post.auth',
    'postAuthorization',
    { order, stateData, finalResult },
    postAuthorizationHook.postAuthorization,
  );
}

function handlePayment(stateData, order, options) {
  const { error, adyenPaymentInstrument, result } = preparePayment(
    order,
    options,
  );

  if (error) {
    return handlePaymentError(order, adyenPaymentInstrument, options);
  }

  const finalResult = getFinalResult(
    order,
    stateData,
    result,
    adyenPaymentInstrument,
  );

  if (!finalResult) {
    return handlePaymentError(order, adyenPaymentInstrument, options);
  }

  const postAuthResult = executePostAuthHook(order, stateData, finalResult);
  if (postAuthResult?.error) {
    return postAuthResult;
  }

  return handlePaymentResult(
    finalResult,
    order,
    adyenPaymentInstrument,
    options,
  );
}

module.exports = handlePayment;
