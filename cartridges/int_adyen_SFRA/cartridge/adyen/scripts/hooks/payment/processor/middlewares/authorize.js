"use strict";

var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
function errorHandler() {
  var serverErrors = [Resource.msg('error.payment.processor.not.supported', 'checkout', null)];
  return {
    authorized: false,
    fieldErrors: [],
    serverErrors: serverErrors,
    error: true
  };
}
function paymentErrorHandler(result) {
  AdyenLogs.error_log('Payment failed:', JSON.stringify(result));
  Transaction.rollback();
  return {
    error: true
  };
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {dw.order.Order} order - The current order
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function authorize(order, paymentInstrument, paymentProcessor) {
  Transaction.wrap(function () {
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
  });
  Transaction.begin();
  var result = adyenCheckout.createPaymentRequest({
    Order: order
  });
  if (result.error) {
    return errorHandler();
  }
  var checkoutResponse = AdyenHelper.createAdyenCheckoutResponse(result);
  if (!checkoutResponse.isFinal) {
    return checkoutResponse;
  }
  if (!checkoutResponse.isSuccessful) {
    return paymentErrorHandler(result);
  }
  AdyenHelper.savePaymentDetails(paymentInstrument, order, result.fullResponse);
  Transaction.commit();
  return {
    authorized: true,
    error: false
  };
}
module.exports = authorize;