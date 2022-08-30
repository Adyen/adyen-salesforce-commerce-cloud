const Logger = require('dw/system/Logger');
const BasketMgr = require('dw/order/BasketMgr');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

function callCheckBalance(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const request = JSON.parse(req.body);
    const paymentMethod = request.paymentMethod ? request.paymentMethod : "giftcard";

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
    Logger.getLogger('Adyen').error(
      `Failed to check gift card balance ${error.toString()}`,
    );
  } finally {
     return next();
  }
}

module.exports = callCheckBalance;
