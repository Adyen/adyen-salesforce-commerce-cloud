"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var URLUtils = require('dw/web/URLUtils');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
function validateBasketAmount(currentBasket) {
  if (currentBasket.totalGrossPrice <= 0) {
    throw new Error('Cannot complete a payment with an amount lower or equal to zero');
  }
}
function validatePaymentDataFromRequest(req, res, next) {
  try {
    var currentBasket = BasketMgr.getCurrentBasket();
    validateBasketAmount(currentBasket);
  } catch (e) {
    AdyenLogs.fatal_log("Error occurred: ".concat(e.message));
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  }
  return next();
}
module.exports = validatePaymentDataFromRequest;