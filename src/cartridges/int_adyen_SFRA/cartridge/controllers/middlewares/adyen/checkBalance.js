const BasketMgr = require('dw/order/BasketMgr');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const constants = require('*/cartridge/adyenConstants/constants');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

function callCheckBalance(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const request = JSON.parse(req.body);
    const paymentMethod = request.paymentMethod
      ? request.paymentMethod
      : constants.ACTIONTYPES.GIFTCARD;

    const checkBalanceRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: {
        currency: currentBasket.currencyCode,
        value: AdyenHelper.getCurrencyValueForApi(
          currentBasket.getTotalGrossPrice(),
        ).value,
      },
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
