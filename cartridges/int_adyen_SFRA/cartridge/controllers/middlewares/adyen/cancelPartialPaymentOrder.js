"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
var collections = require('*/cartridge/scripts/util/collections');
var constants = require('*/cartridge/adyenConstants/constants');
function cancelPartialPaymentOrder(req, res, next) {
  try {
    var request = JSON.parse(req.body);
    var partialPaymentsOrder = request.partialPaymentsOrder;
    var cancelOrderRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      order: partialPaymentsOrder
    };
    var response = adyenCheckout.doCancelPartialPaymentOrderCall(cancelOrderRequest);
    if (response.resultCode === constants.RESULTCODES.RECEIVED) {
      var currentBasket = BasketMgr.getCurrentBasket();
      Transaction.wrap(function () {
        collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
          if (item.custom.adyenPartialPaymentsOrder) {
            currentBasket.removePaymentInstrument(item);
          }
        });
      });
      session.privacy.giftCardResponse = null;
    } else {
      throw new Error("received resultCode ".concat(response.resultCode));
    }
    res.json(response);
  } catch (error) {
    Logger.getLogger('Adyen').error("Could not cancel partial payments order.. ".concat(error.toString()));
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
  }
  return next();
}
module.exports = cancelPartialPaymentOrder;