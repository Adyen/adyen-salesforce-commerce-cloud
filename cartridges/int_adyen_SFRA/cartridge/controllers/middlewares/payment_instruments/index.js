"use strict";

var savePayment = require('*/cartridge/controllers/middlewares/payment_instruments/savePayment');
var deletePayment = require('*/cartridge/controllers/middlewares/payment_instruments/deletePayment');
module.exports = {
  savePayment: savePayment,
  deletePayment: deletePayment
};