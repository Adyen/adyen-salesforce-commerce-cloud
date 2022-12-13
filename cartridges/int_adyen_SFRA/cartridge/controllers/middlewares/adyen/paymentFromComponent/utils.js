"use strict";

var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var constants = require('*/cartridge/adyenConstants/constants');
var collections = require('*/cartridge/scripts/util/collections');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
function getProcessedPaymentInstrument(basket, requestForm) {
  var paymentInstrument;
  Transaction.wrap(function () {
    collections.forEach(basket.getPaymentInstruments(), function (item) {
      basket.removePaymentInstrument(item);
    });
    paymentInstrument = basket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, basket.totalGrossPrice);
    var _PaymentMgr$getPaymen = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod),
      paymentProcessor = _PaymentMgr$getPaymen.paymentProcessor;
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    paymentInstrument.custom.adyenPaymentData = requestForm.data;
    paymentInstrument.custom.adyenPaymentMethod = requestForm.paymentMethod;
  });
  return paymentInstrument;
}
function handlePayment(response, order, paymentInstrument) {
  var result;
  Transaction.wrap(function () {
    result = adyenCheckout.createPaymentRequest({
      Order: order,
      PaymentInstrument: paymentInstrument
    });
  });
  result.orderNo = order.orderNo;
  response.json(result);
}
module.exports = {
  getProcessedPaymentInstrument: getProcessedPaymentInstrument,
  handlePayment: handlePayment
};