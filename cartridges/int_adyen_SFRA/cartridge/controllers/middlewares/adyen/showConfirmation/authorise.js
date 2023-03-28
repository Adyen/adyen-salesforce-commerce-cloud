"use strict";

var Locale = require('dw/util/Locale');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var OrderModel = require('*/cartridge/models/order');
var handleOrderConfirm = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/order');
var payment = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/payment');
function handleAuthorised(adyenPaymentInstrument, detailsResult, order, options) {
  var req = options.req;

  // custom fraudDetection
  var fraudDetectionStatus = {
    status: 'success'
  };

  // Places the order
  var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
  if (placeOrderResult.error) {
    return payment.handlePaymentError(order, 'placeOrder', options);
  }
  var currentLocale = Locale.getLocale(req.locale.id);
  var orderModel = new OrderModel(order, {
    countryCode: currentLocale.country
  });

  // Save orderModel to custom object during session
  return handleOrderConfirm(adyenPaymentInstrument, detailsResult, order, orderModel, options);
}
module.exports = handleAuthorised;