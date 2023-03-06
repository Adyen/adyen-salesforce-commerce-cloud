const BasketMgr = require('dw/order/BasketMgr');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const constants = require('*/cartridge/adyenConstants/constants');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

function callCheckBalance(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const giftCardsAdded = currentBasket.custom?.adyenGiftCards
      ? JSON.parse(currentBasket.custom.adyenGiftCards)
      : null;

    const orderAmount = {
      currency: currentBasket.currencyCode,
      value: AdyenHelper.getCurrencyValueForApi(
        currentBasket.getTotalGrossPrice(),
      ).value,
    };
    const amount = giftCardsAdded
      ? giftCardsAdded[giftCardsAdded.length - 1].remainingAmount
      : orderAmount;

    const request = JSON.parse(req.body);
    const paymentMethod = request.paymentMethod
      ? request.paymentMethod
      : constants.ACTIONTYPES.GIFTCARD;

    const checkBalanceRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount,
      reference: currentBasket.getUUID(),
      paymentMethod,
    };

    const response = adyenCheckout.doCheckBalanceCall(checkBalanceRequest);

    res.json(response);
  } catch (error) {
    AdyenLogs.error_log(
      `Failed to check gift card balance ${error.toString()}`,
    );
    res.json({ error: true });
  }
  return next();
}

module.exports = callCheckBalance;
