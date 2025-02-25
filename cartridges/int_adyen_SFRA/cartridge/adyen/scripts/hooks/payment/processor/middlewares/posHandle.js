"use strict";

var Transaction = require('dw/system/Transaction');
var collections = require('*/cartridge/scripts/util/collections');
var constants = require('*/cartridge/adyen/config/constants');
function posHandle(basket) {
  Transaction.wrap(function () {
    collections.forEach(basket.getPaymentInstruments(), function (item) {
      basket.removePaymentInstrument(item);
    });
    var paymentInstrument = basket.createPaymentInstrument(constants.METHOD_ADYEN_POS, basket.totalGrossPrice);
    paymentInstrument.custom.adyenPaymentMethod = 'POS Terminal';
  });
  return {
    error: false
  };
}
module.exports = posHandle;