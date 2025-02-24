"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var URLUtils = require('dw/web/URLUtils');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
function validateBasketAmount(currentBasket) {
  if (!currentBasket || currentBasket.totalGrossPrice <= 0) {
    throw new Error('Cannot complete a payment with an amount lower or equal to zero');
  }
}
function validatePaymentDataFromRequest(req, res, next) {
  try {
    var _req$form;
    var _ref = (_req$form = req.form) !== null && _req$form !== void 0 && _req$form.data ? JSON.parse(req.form.data) : null,
      isExpressPdp = _ref.isExpressPdp;
    var currentBasket = isExpressPdp ? BasketMgr.getTemporaryBasket(session.privacy.temporaryBasketId) : BasketMgr.getCurrentBasket();
    validateBasketAmount(currentBasket);
    return next();
  } catch (e) {
    AdyenLogs.fatal_log("Error occurred: ".concat(e.message));
    return res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  }
}
module.exports = validatePaymentDataFromRequest;