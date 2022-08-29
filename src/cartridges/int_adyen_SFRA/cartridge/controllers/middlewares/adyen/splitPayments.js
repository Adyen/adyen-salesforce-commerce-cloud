const Logger = require('dw/system/Logger');
const BasketMgr = require('dw/order/BasketMgr');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

function addMinutes(date, minutes) {
  return new Date(date.getTime() + minutes * 60000);
}

function createSplitPaymentsOrder(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();

    let date = new Date();
    date = addMinutes(date, 30);

    const splitPaymentsRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: {
        currency: currentBasket.currencyCode,
        value: AdyenHelper.getCurrencyValueForApi(
          currentBasket.getTotalGrossPrice(),
        ).value,
      },
      reference: currentBasket.getUUID(),
      expiresAt: date.toISOString(),
    };

    const response = adyenCheckout.doCreateSplitPaymentOrderCall(
      splitPaymentsRequest,
    );

    res.json(response);
    return next();
  } catch (error) {
    Logger.getLogger('Adyen').error('Failed to create split payments order');
    Logger.getLogger('Adyen').error(error);
    return next();
  }
}

module.exports = createSplitPaymentsOrder;
