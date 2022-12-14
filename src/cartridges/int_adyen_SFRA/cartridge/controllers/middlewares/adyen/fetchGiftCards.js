const Logger = require('dw/system/Logger');
const BasketMgr = require('dw/order/BasketMgr');

function fetchGiftCards(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const addedGiftCards = currentBasket.custom.adyenGiftCards
      ? JSON.parse(currentBasket.custom.adyenGiftCards)
      : [];
    res.json({
      giftCards: addedGiftCards,
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
