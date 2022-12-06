"use strict";

var adyen = require('*/cartridge/controllers/middlewares/adyen/index');
var checkout = require('*/cartridge/controllers/middlewares/checkout/index');
var order = require('*/cartridge/controllers/middlewares/order/index');
var paymentInstruments = require('*/cartridge/controllers/middlewares/payment_instruments/index');
module.exports = {
  adyen: adyen,
  checkout: checkout,
  order: order,
  paymentInstruments: paymentInstruments
};