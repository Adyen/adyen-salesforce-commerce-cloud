const BasketMgr = require('dw/order/BasketMgr');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const constants = require('*/cartridge/adyen/config/constants');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

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
      reference: currentBasket.custom.adyenGiftCardsOrderNo,
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
      resultCode: response?.resultCode,
      remainingAmount: response?.remainingAmount,
      amount: orderAmount,
      expiresAt: date.toISOString(),
    };

    res.json(responseData);
  } catch (error) {
    AdyenLogs.error_log('Failed to create partial payments order:', error);
    res.json({ error: true });
  }

  return next();
}

module.exports = createPartialPaymentsOrder;
