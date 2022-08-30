const Logger = require('dw/system/Logger');
const BasketMgr = require('dw/order/BasketMgr');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

function addMinutes(minutes) {
    const date = new Date();
  return new Date(date.getTime() + minutes * 60000);
}

function createSplitPaymentsOrder(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();

    const date = addMinutes(30);

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
  } catch (error) {
    Logger.getLogger('Adyen').error(`Failed to create split payments order.. ${error.toString()}`);
  } finally {
      return next();
  }
}

module.exports = createSplitPaymentsOrder;
