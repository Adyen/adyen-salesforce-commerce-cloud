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
const setErrorType = require('*/cartridge/adyen/logs/setErrorType');
const { AdyenError } = require('*/cartridge/adyen/logs/adyenError');

/**
 * Helper function to cancel partial payment order and refund gift cards
 * @param {dw.order.Basket} basket - The current basket
 * @returns {Object} Response from Adyen API
 * @throws {AdyenError} If cancellation fails
 */
function cancelPartialPaymentOrderHelper(basket) {
  if (!basket || !basket.custom.partialPaymentOrderData) {
    return null;
  }

  const { order } = JSON.parse(basket.custom.partialPaymentOrderData);

  const cancelOrderRequest = {
    merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
    order,
  };

  const response =
    adyenCheckout.doCancelPartialPaymentOrderCall(cancelOrderRequest);

  if (response.resultCode === constants.RESULTCODES.RECEIVED) {
    Transaction.wrap(() => {
      collections.forEach(basket.getPaymentInstruments(), (item) => {
        if (item.custom.adyenPartialPaymentsOrder) {
          basket.removePaymentInstrument(item);
        }
      });
      clearForms.clearAdyenBasketData(basket);
    });
    session.privacy.giftCardResponse = null;
    session.privacy.partialPaymentAmounts = null;
    session.privacy.giftCardBalance = null;
  } else {
    throw new AdyenError(`received resultCode ${response.resultCode}`);
  }

  return response;
}

function cancelPartialPaymentOrder(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const response = cancelPartialPaymentOrderHelper(currentBasket);

    if (!response) {
      throw new AdyenError('No partial payment order data found');
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
    setErrorType(error, res, {
      errorMessage: Resource.msg('error.technical', 'checkout', null),
    });
  }

  return next();
}

module.exports = cancelPartialPaymentOrder;
module.exports.cancelPartialPaymentOrderHelper =
  cancelPartialPaymentOrderHelper;
