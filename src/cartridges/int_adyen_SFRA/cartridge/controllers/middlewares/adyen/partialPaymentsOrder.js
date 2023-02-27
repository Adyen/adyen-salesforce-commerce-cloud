const BasketMgr = require('dw/order/BasketMgr');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const constants = require('*/cartridge/adyenConstants/constants');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

function addMinutes(minutes) {
  const date = new Date();
  return new Date(date.getTime() + minutes * 60000);
}

function createPartialPaymentsOrder(req, res, next) {
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

    const date = addMinutes(constants.GIFTCARD_EXPIRATION_MINUTES);

    const partialPaymentsRequest = {
      amount,
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      reference: currentBasket.getUUID(),
      expiresAt: date.toISOString(),
    };

    const response = adyenCheckout.doCreatePartialPaymentOrderCall(
      partialPaymentsRequest,
    );

    // Cache order data to reuse at payments
    session.privacy.partialPaymentData = JSON.stringify({
      order: {
        orderData: response?.orderData,
        pspReference: response?.pspReference,
      },
      remainingAmount: response?.remainingAmount,
      amount: orderAmount,
    });

    const responseData = {
      ...response,
      expiresAt: date.toISOString(),
    };

    res.json(responseData);
  } catch (error) {
    AdyenLogs.error_log(
      `Failed to create partial payments order.. ${error.toString()}`,
    );
    res.json({ error: true });
  }

  return next();
}

module.exports = createPartialPaymentsOrder;
