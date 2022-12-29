"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var constants = require('*/cartridge/adyenConstants/constants');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
function callCheckBalance(req, res, next) {
  try {
    var currentBasket = BasketMgr.getCurrentBasket();
    var request = JSON.parse(req.body);
    var paymentMethod = request.paymentMethod ? request.paymentMethod : constants.ACTIONTYPES.GIFTCARD;
    var checkBalanceRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: {
        currency: currentBasket.currencyCode,
        value: AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()).value
      },
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