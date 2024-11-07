"use strict";

var constants = require('*/cartridge/adyen/config/constants');
var collections = require('*/cartridge/scripts/util/collections');
function processPayment(order, handlePaymentResult, req, res, emit) {
  res.json({
    error: false,
    adyenAction: handlePaymentResult.action,
    orderID: order.orderNo,
    orderToken: order.orderToken
  });
  emit('route:Complete');
}
function isNotAdyen(currentBasket) {
  var isAdyenBool = false;
  collections.forEach(currentBasket.getPaymentInstruments(), function (paymentInstrument) {
    if ([constants.METHOD_ADYEN, paymentInstrument.METHOD_CREDIT_CARD, constants.METHOD_ADYEN_POS, constants.METHOD_ADYEN_COMPONENT].indexOf(paymentInstrument.paymentMethod) !== -1) {
      isAdyenBool = true;
    }
  });
  return !isAdyenBool;
}
module.exports = {
  processPayment: processPayment,
  isNotAdyen: isNotAdyen
};