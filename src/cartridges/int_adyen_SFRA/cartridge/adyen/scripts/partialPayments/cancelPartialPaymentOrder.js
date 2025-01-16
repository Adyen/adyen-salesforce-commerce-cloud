const BasketMgr = require('dw/order/BasketMgr');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyen/config/constants');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const clearForms = require('*/cartridge/adyen/utils/clearForms');

function cancelPartialPaymentOrder(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const { order } = JSON.parse(session.privacy.partialPaymentData);

    const cancelOrderRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      order,
    };

    const response =
      adyenCheckout.doCancelPartialPaymentOrderCall(cancelOrderRequest);

    if (response.resultCode === constants.RESULTCODES.RECEIVED) {
      Transaction.wrap(() => {
        collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
          if (item.custom.adyenPartialPaymentsOrder) {
            currentBasket.removePaymentInstrument(item);
          }
        });
        clearForms.clearAdyenBasketData(currentBasket);
      });
      session.privacy.giftCardResponse = null;
      session.privacy.partialPaymentData = null;
      session.privacy.giftCardBalance = null;
    } else {
      throw new Error(`received resultCode ${response.resultCode}`);
    }

    const amount = {
      currency: currentBasket.currencyCode,
      value: AdyenHelper.getCurrencyValueForApi(
        currentBasket.getTotalGrossPrice(),
      ).value,
    };

    res.json({
      resultCode: response.resultCode,
      amount,
    });
  } catch (error) {
    AdyenLogs.error_log('Could not cancel partial payments order:', error);
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null),
    });
  }

  return next();
}

module.exports = cancelPartialPaymentOrder;
