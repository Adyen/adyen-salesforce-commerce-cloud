"use strict";

var Locale = require('dw/util/Locale');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var OrderModel = require('*/cartridge/models/order');

var handleOrderConfirm = require('./order');

var payment = require('./payment');

function handleAuthorised(order, result, adyenPaymentInstrument, options) {
  var req = options.req;

  if (result.resultCode === 'Received' && result.paymentMethod.indexOf('alipay_hk') > -1) {
    return payment.handleReceived(order, result, options);
  } // custom fraudDetection


  var fraudDetectionStatus = {
    status: 'success'
  }; // Places the order

  var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);

  if (placeOrderResult.error) {
    return payment.handlePaymentError(order, 'placeOrder', options);
  }

  var currentLocale = Locale.getLocale(req.locale.id);
  var orderModel = new OrderModel(order, {
    countryCode: currentLocale.country
  }); // Save orderModel to custom object during session

  return handleOrderConfirm(order, orderModel, adyenPaymentInstrument, result, options);
}

module.exports = handleAuthorised;