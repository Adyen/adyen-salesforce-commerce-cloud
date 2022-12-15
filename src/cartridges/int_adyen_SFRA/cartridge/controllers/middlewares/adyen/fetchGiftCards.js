const Logger = require('dw/system/Logger');
const BasketMgr = require('dw/order/BasketMgr');
const Money = require('dw/value/Money');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function fetchGiftCards(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const addedGiftCards = currentBasket.custom.adyenGiftCards
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
    Logger.getLogger('Adyen').error(
      `Failed to create partial payments order.. ${error.toString()}`,
    );
    res.json({ error: true });
  }

  return next();
}

module.exports = fetchGiftCards;
