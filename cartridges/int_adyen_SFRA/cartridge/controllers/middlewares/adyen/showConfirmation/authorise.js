"use strict";

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var handleOrderConfirm = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/order');
var payment = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/payment');
function handleAuthorised(adyenPaymentInstrument, detailsResult, order, options) {
  // custom fraudDetection
  var fraudDetectionStatus = {
    status: 'success'
  };

  // Places the order
  var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
  if (placeOrderResult.error) {
    return payment.handlePaymentError(order, 'placeOrder', options);
  }
  return handleOrderConfirm(adyenPaymentInstrument, detailsResult, order, options);
}
module.exports = handleAuthorised;