"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
var constants = require('*/cartridge/adyen/config/constants');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
function addMinutes(minutes) {
  var date = new Date();
  return new Date(date.getTime() + minutes * 60000);
}
function createPartialPaymentsOrder(req, res, next) {
  try {
    var _currentBasket$custom;
    var currentBasket = BasketMgr.getCurrentBasket();
    var giftCardsAdded = (_currentBasket$custom = currentBasket.custom) !== null && _currentBasket$custom !== void 0 && _currentBasket$custom.adyenGiftCards ? JSON.parse(currentBasket.custom.adyenGiftCards) : null;
    var orderAmount = {
      currency: currentBasket.currencyCode,
      value: AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()).value
    };
    var amount = giftCardsAdded ? giftCardsAdded[giftCardsAdded.length - 1].remainingAmount : orderAmount;
    var date = addMinutes(constants.GIFTCARD_EXPIRATION_MINUTES);
    var partialPaymentsRequest = {
      amount: amount,
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      reference: currentBasket.custom.adyenGiftCardsOrderNo,
      expiresAt: date.toISOString()
    };
    var response = adyenCheckout.doCreatePartialPaymentOrderCall(partialPaymentsRequest);

    // Cache order data to reuse at payments
    session.privacy.partialPaymentData = JSON.stringify({
      order: {
        orderData: response === null || response === void 0 ? void 0 : response.orderData,
        pspReference: response === null || response === void 0 ? void 0 : response.pspReference
      },
      remainingAmount: response === null || response === void 0 ? void 0 : response.remainingAmount,
      amount: orderAmount
    });
    var responseData = {
      resultCode: response === null || response === void 0 ? void 0 : response.resultCode,
      remainingAmount: response === null || response === void 0 ? void 0 : response.remainingAmount,
      amount: orderAmount,
      expiresAt: date.toISOString()
    };
    res.json(responseData);
  } catch (error) {
    AdyenLogs.error_log('Failed to create partial payments order:', error);
    res.json({
      error: true
    });
  }
  return next();
}
module.exports = createPartialPaymentsOrder;