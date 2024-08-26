const BasketMgr = require('dw/order/BasketMgr');
const Money = require('dw/value/Money');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const clearForms = require('*/cartridge/adyen/utils/clearForms');

function fetchGiftCards(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const addedGiftCards = currentBasket?.custom?.adyenGiftCards
      ? JSON.parse(currentBasket.custom.adyenGiftCards)
      : [];
    let totalDiscountedAmount = null;
    if (addedGiftCards?.length) {
      const divideBy = AdyenHelper.getDivisorForCurrency({
        currencyCode: currentBasket.currencyCode,
      });
      totalDiscountedAmount = new Money(
        addedGiftCards.reduce(
          (accumulator, currentValue) =>
            accumulator + currentValue.giftCard.amount.value,
          0,
        ),
        addedGiftCards[addedGiftCards.length - 1].giftCard.amount.currency,
      )
        .divide(divideBy)
        .toFormattedString();
    }
    res.json({
      giftCards: addedGiftCards,
      totalDiscountedAmount,
    });
  } catch (error) {
    AdyenLogs.error_log('Failed to fetch gift cards:', error);
    const currentBasket = BasketMgr.getCurrentBasket();
    clearForms.clearAdyenBasketData(currentBasket);
    res.json({ error: true });
  }

  return next();
}

module.exports = fetchGiftCards;
