"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var constants = require('*/cartridge/adyenConstants/constants');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
function callCheckBalance(req, res, next) {
  try {
    var _currentBasket$custom;
    var currentBasket = BasketMgr.getCurrentBasket();
    var giftCardsAdded = (_currentBasket$custom = currentBasket.custom) !== null && _currentBasket$custom !== void 0 && _currentBasket$custom.adyenGiftCards ? JSON.parse(currentBasket.custom.adyenGiftCards) : null;
    var orderAmount = {
      currency: currentBasket.currencyCode,
      value: AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()).value
    };
    var amount = giftCardsAdded ? giftCardsAdded[giftCardsAdded.length - 1].remainingAmount : orderAmount;
    var request = JSON.parse(req.body);
    var paymentMethod = request.paymentMethod ? request.paymentMethod : constants.ACTIONTYPES.GIFTCARD;
    var checkBalanceRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: amount,
      reference: currentBasket.getUUID(),
      paymentMethod: paymentMethod
    };
    var response = adyenCheckout.doCheckBalanceCall(checkBalanceRequest);
    res.json(response);
  } catch (error) {
    AdyenLogs.error_log("Failed to check gift card balance ".concat(error.toString()));
    res.json({
      error: true
    });
  }
  return next();
}
module.exports = callCheckBalance;