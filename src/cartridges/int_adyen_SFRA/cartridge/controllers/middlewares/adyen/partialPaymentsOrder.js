const Logger = require('dw/system/Logger');
const BasketMgr = require('dw/order/BasketMgr');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const constants = require('*/cartridge/adyenConstants/constants');

function addMinutes(minutes) {
  const date = new Date();
  return new Date(date.getTime() + minutes * 60000);
}

function createPartialPaymentsOrder(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const partialPaymentsOrderData = JSON.parse(
      session.privacy.partialPaymentData,
    );

    Logger.getLogger('Adyen').error(JSON.stringify(partialPaymentsOrderData));

    const date = addMinutes(constants.GIFTCARD_EXPIRATION_MINUTES);

    const partialPaymentsRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: {
        currency: partialPaymentsOrderData && partialPaymentsOrderData.amount ? partialPaymentsOrderData.amount.currency : currentBasket.currencyCode,
        value: partialPaymentsOrderData && partialPaymentsOrderData.amount ? partialPaymentsOrderData.amount.value : AdyenHelper.getCurrencyValueForApi(
          currentBasket.getTotalGrossPrice(),
        ).value,
      },
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
      amount: response?.amount,
    });

    res.json({
      ...response,
      expiresAt: date.toISOString(),
    });
  } catch (error) {
    Logger.getLogger('Adyen').error(
      `Failed to create partial payments order.. ${error.toString()}`,
    );
  }

  return next();
}

module.exports = createPartialPaymentsOrder;
