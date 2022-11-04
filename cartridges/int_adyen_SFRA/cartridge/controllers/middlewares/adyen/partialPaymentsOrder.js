"use strict";

var Logger = require('dw/system/Logger');
var BasketMgr = require('dw/order/BasketMgr');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
function addMinutes(minutes) {
  var date = new Date();
  return new Date(date.getTime() + minutes * 60000);
}
function createPartialPaymentsOrder(req, res, next) {
  try {
    var currentBasket = BasketMgr.getCurrentBasket();
    var date = addMinutes(30);
    var partialPaymentsRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: {
        currency: currentBasket.currencyCode,
        value: AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()).value
      },
      reference: currentBasket.getUUID(),
      expiresAt: date.toISOString()
    };
    var response = adyenCheckout.doCreatePartialPaymentOrderCall(partialPaymentsRequest);
    res.json(response);
  } catch (error) {
    Logger.getLogger('Adyen').error("Failed to create partial payments order.. ".concat(error.toString()));
  }
  return next();
}
module.exports = createPartialPaymentsOrder;