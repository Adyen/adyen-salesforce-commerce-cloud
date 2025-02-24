"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
var adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
var collections = require('*/cartridge/scripts/util/collections');
var constants = require('*/cartridge/adyen/config/constants');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var clearForms = require('*/cartridge/adyen/utils/clearForms');
function cancelPartialPaymentOrder(req, res, next) {
  try {
    var currentBasket = BasketMgr.getCurrentBasket();
    var _JSON$parse = JSON.parse(session.privacy.partialPaymentData),
      order = _JSON$parse.order;
    var cancelOrderRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      order: order
    };
    var response = adyenCheckout.doCancelPartialPaymentOrderCall(cancelOrderRequest);
    if (response.resultCode === constants.RESULTCODES.RECEIVED) {
      Transaction.wrap(function () {
        collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
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
      throw new Error("received resultCode ".concat(response.resultCode));
    }
    var amount = {
      currency: currentBasket.currencyCode,
      value: AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()).value
    };
    res.json({
      resultCode: response.resultCode,
      amount: amount
    });
  } catch (error) {
    AdyenLogs.error_log('Could not cancel partial payments order:', error);
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
  }
  return next();
}
module.exports = cancelPartialPaymentOrder;