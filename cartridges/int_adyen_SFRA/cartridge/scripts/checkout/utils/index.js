"use strict";

var getPayments = require('./getPayments');

var validatePaymentMethod = require('./validatePaymentMethod');

module.exports = {
  getPayments: getPayments,
  validatePaymentMethod: validatePaymentMethod
};