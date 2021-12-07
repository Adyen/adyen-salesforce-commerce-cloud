"use strict";

var Resource = require('dw/web/Resource');

var Logger = require('dw/system/Logger');

var Transaction = require('dw/system/Transaction');

var OrderMgr = require('dw/order/OrderMgr');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

var paymentResponseHandler = require('*/cartridge/scripts/hooks/payment/processor/middlewares/authorize/paymentResponse');

var constants = require('*/cartridge/adyenConstants/constants');

function errorHandler() {
  var serverErrors = [Resource.msg('error.payment.processor.not.supported', 'checkout', null)];
  return {
    authorized: false,
    fieldErrors: [],
    serverErrors: serverErrors,
    error: true
  };
}

function check3DS2(result) {
  return result.threeDS2 || result.resultCode === constants.RESULTCODES.REDIRECTSHOPPER;
}

function paymentErrorHandler(result) {
  Logger.getLogger('Adyen').error("Payment failed, result: ".concat(JSON.stringify(result)));
  Transaction.rollback();
  return {
    error: true
  };
}
/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */


function authorize(orderNumber, paymentInstrument, paymentProcessor) {
  var order = OrderMgr.getOrder(orderNumber);
  Transaction.wrap(function () {
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
  });
  Transaction.begin();
  var result = adyenCheckout.createPaymentRequest({
    Order: order,
    PaymentInstrument: paymentInstrument
  });

  if (result.error) {
    return errorHandler();
  } // Trigger 3DS2 flow


  if (check3DS2(result)) {
    return paymentResponseHandler(paymentInstrument, result, orderNumber);
  }

  if (result.decision !== 'ACCEPT') {
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