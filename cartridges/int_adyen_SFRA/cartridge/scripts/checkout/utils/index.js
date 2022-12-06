"use strict";

var getPayments = require('*/cartridge/scripts/checkout/utils/getPayments');
var validatePaymentMethod = require('*/cartridge/scripts/checkout/utils/validatePaymentMethod');
module.exports = {
  getPayments: getPayments,
  validatePaymentMethod: validatePaymentMethod
};