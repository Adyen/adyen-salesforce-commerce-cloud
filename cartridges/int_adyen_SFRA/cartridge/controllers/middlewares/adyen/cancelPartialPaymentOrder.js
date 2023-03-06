"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
var collections = require('*/cartridge/scripts/util/collections');
var constants = require('*/cartridge/adyenConstants/constants');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
var _require = require('*/cartridge/controllers/utils/index'),
  clearForms = _require.clearForms;
function cancelPartialPaymentOrder(req, res, next) {
  try {
    var currentBasket = BasketMgr.getCurrentBasket();
    var request = JSON.parse(req.body);
    var partialPaymentsOrder = request.partialPaymentsOrder;
    var cancelOrderRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      order: partialPaymentsOrder
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
    } else {
      throw new Error("received resultCode ".concat(response.resultCode));
    }
    var amount = {
      currency: currentBasket.currencyCode,
      value: AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()).value
    };
    res.json(_objectSpread(_objectSpread({}, response), {}, {
      amount: amount
    }));
  } catch (error) {
    AdyenLogs.error_log("Could not cancel partial payments order.. ".concat(error.toString()));
    res.json({
      error: true,
      errorMessage: Resource.msg('error.technical', 'checkout', null)
    });
  }
  return next();
}
module.exports = cancelPartialPaymentOrder;