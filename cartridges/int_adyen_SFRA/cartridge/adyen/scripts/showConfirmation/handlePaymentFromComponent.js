"use strict";

var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');
var adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
var constants = require('*/cartridge/adyen/config/constants');
var clearForms = require('*/cartridge/adyen/utils/clearForms');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
function handlePaymentError(order, adyenPaymentInstrument, _ref) {
  var res = _ref.res,
    next = _ref.next;
  clearForms.clearAdyenData(adyenPaymentInstrument);
  Transaction.wrap(function () {
    OrderMgr.failOrder(order, true);
  });
  res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
  return next();
}
function handlePaymentsDetailsCall(stateData, adyenPaymentInstrument) {
  var details = stateData.details,
    paymentData = stateData.paymentData;

  // redirect to payment/details
  var requestObject = {
    details: details,
    paymentData: paymentData
  };
  var result = adyenCheckout.doPaymentsDetailsCall(requestObject);
  return {
    result: result,
    adyenPaymentInstrument: adyenPaymentInstrument
  };
}
function handleAuthorisedPayment(order, result, adyenPaymentInstrument, _ref2) {
  var res = _ref2.res,
    next = _ref2.next;
  Transaction.wrap(function () {
    AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
  });
  clearForms.clearAdyenData(adyenPaymentInstrument);
  clearForms.clearForms();
  // determines SFRA version for backwards compatibility
  if (AdyenConfigs.getAdyenSFRA6Compatibility() === true) {
    res.render('orderConfirmForm', {
      orderID: order.orderNo,
      orderToken: order.orderToken
    });
  } else {
    res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
  }
  return next();
}
function handlePaymentResult(result, order, adyenPaymentInstrument, options) {
  // Authorised: The payment authorisation was successfully completed.
  if ([constants.RESULTCODES.AUTHORISED, constants.RESULTCODES.PENDING, constants.RESULTCODES.RECEIVED].indexOf(result.resultCode) > -1) {
    return handleAuthorisedPayment(order, result, adyenPaymentInstrument, options);
  }
  Transaction.wrap(function () {
    order.custom.Adyen_pspReference = result.pspReference;
    order.custom.Adyen_eventCode = result.resultCode;
    order.custom.Adyen_paypalExpressResponse = null;
    adyenPaymentInstrument.custom.adyenPaymentData = null;
    session.privacy.paypalExpressOrderNo = null;
    session.privacy.pspReference = null;
  });
  return handlePaymentError(order, adyenPaymentInstrument, options);
}

// eslint-disable-next-line complexity
function handlePayment(stateData, order, options) {
  var _options$req$form;
  var paymentInstruments = order.getPaymentInstruments(AdyenHelper.getOrderMainPaymentInstrumentType(order));
  var result = JSON.parse((_options$req$form = options.req.form) === null || _options$req$form === void 0 ? void 0 : _options$req$form.result);
  var adyenPaymentInstrument = paymentInstruments[0];
  var hasStateData = (stateData === null || stateData === void 0 ? void 0 : stateData.paymentData) && (stateData === null || stateData === void 0 ? void 0 : stateData.details);
  if (result !== null && result !== void 0 && result.error || order.status.value === Order.ORDER_STATUS_FAILED) {
    AdyenLogs.error_log("Could not call payment/details for order ".concat(order.orderNo));
    return handlePaymentError(order, adyenPaymentInstrument, options);
  }
  var finalResult;
  if (!hasStateData) {
    if (result && (JSON.stringify(result).indexOf('amazonpay') > -1 || JSON.stringify(result).indexOf('applepay') > -1 || JSON.stringify(result).indexOf('googlepay') > -1 || JSON.stringify(result).indexOf('cashapp') > -1)) {
      finalResult = result;
    } else {
      return handlePaymentError(order, adyenPaymentInstrument, options);
    }
  }
  var paymentData = JSON.parse(adyenPaymentInstrument.custom.adyenPaymentData);
  var isPayPalExpress = AdyenHelper.isPayPalExpress(paymentData.paymentMethod);
  var detailsCall = hasStateData && !isPayPalExpress ? handlePaymentsDetailsCall(stateData, adyenPaymentInstrument) : null;
  if (isPayPalExpress) {
    finalResult = JSON.parse(order.custom.Adyen_paypalExpressResponse);
  } else {
    finalResult = finalResult || (detailsCall === null || detailsCall === void 0 ? void 0 : detailsCall.result);
  }
  return handlePaymentResult(finalResult, order, adyenPaymentInstrument, options);
}
module.exports = handlePayment;