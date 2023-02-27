"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var Money = require('dw/value/Money');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
var _require = require('*/cartridge/controllers/utils/index'),
  clearForms = _require.clearForms;
function fetchGiftCards(req, res, next) {
  try {
    var _currentBasket$custom;
    var currentBasket = BasketMgr.getCurrentBasket();
    var addedGiftCards = currentBasket !== null && currentBasket !== void 0 && (_currentBasket$custom = currentBasket.custom) !== null && _currentBasket$custom !== void 0 && _currentBasket$custom.adyenGiftCards ? JSON.parse(currentBasket.custom.adyenGiftCards) : [];
    var totalDiscountedAmount = null;
    if (addedGiftCards !== null && addedGiftCards !== void 0 && addedGiftCards.length) {
      var divideBy = AdyenHelper.getDivisorForCurrency({
        currencyCode: currentBasket.currencyCode
      });
      totalDiscountedAmount = new Money(addedGiftCards.reduce(function (accumulator, currentValue) {
        return accumulator + currentValue.giftCard.amount.value;
      }, 0), addedGiftCards[addedGiftCards.length - 1].giftCard.amount.currency).divide(divideBy).toFormattedString();
    }
    res.json({
      giftCards: addedGiftCards,
      totalDiscountedAmount: totalDiscountedAmount
    });
  } catch (error) {
    AdyenLogs.error_log("Failed to fetch gift cards ".concat(error.toString()));
    var _currentBasket = BasketMgr.getCurrentBasket();
    clearForms.clearAdyenBasketData(_currentBasket);
    res.json({
      error: true
    });
  }
  return next();
}
module.exports = fetchGiftCards;