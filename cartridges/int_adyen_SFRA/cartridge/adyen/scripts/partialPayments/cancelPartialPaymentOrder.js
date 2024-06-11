"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
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