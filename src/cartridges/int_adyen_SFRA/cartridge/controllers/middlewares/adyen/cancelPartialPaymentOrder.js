const BasketMgr = require('dw/order/BasketMgr');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyenConstants/constants');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
const { clearForms } = require('*/cartridge/controllers/utils/index');

function cancelPartialPaymentOrder(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const request = JSON.parse(req.body);
    const { partialPaymentsOrder } = request;

    const cancelOrderRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      order: partialPaymentsOrder,
    };

    const response = adyenCheckout.doCancelPartialPaymentOrderCall(
      cancelOrderRequest,
    );

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
      ...response,
      amount,
    });
  } catch (error) {
    AdyenLogs.error_log(
      `Could not cancel partial payments order.. ${error.toString()}`,
    );
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null),
    });
  }

  return next();
}

module.exports = cancelPartialPaymentOrder;
