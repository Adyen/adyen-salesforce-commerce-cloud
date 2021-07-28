"use strict";

var savePayment = require('./savePayment');

var deletePayment = require('./deletePayment');

module.exports = {
  savePayment: savePayment,
  deletePayment: deletePayment
};