"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : String(i); }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var BasketMgr = require('dw/order/BasketMgr');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var constants = require('*/cartridge/adyenConstants/constants');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
function addMinutes(minutes) {
  var date = new Date();
  return new Date(date.getTime() + minutes * 60000);
}
function createPartialPaymentsOrder(req, res, next) {
  try {
    var _currentBasket$custom;
    var currentBasket = BasketMgr.getCurrentBasket();
    var giftCardsAdded = (_currentBasket$custom = currentBasket.custom) !== null && _currentBasket$custom !== void 0 && _currentBasket$custom.adyenGiftCards ? JSON.parse(currentBasket.custom.adyenGiftCards) : null;
    var orderAmount = {
      currency: currentBasket.currencyCode,
      value: AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()).value
    };
    var amount = giftCardsAdded ? giftCardsAdded[giftCardsAdded.length - 1].remainingAmount : orderAmount;
    var date = addMinutes(constants.GIFTCARD_EXPIRATION_MINUTES);
    var partialPaymentsRequest = {
      amount: amount,
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      reference: currentBasket.custom.adyenGiftCardsOrderNo,
      expiresAt: date.toISOString()
    };
    var response = adyenCheckout.doCreatePartialPaymentOrderCall(partialPaymentsRequest);

    // Cache order data to reuse at payments
    session.privacy.partialPaymentData = JSON.stringify({
      order: {
        orderData: response === null || response === void 0 ? void 0 : response.orderData,
        pspReference: response === null || response === void 0 ? void 0 : response.pspReference
      },
      remainingAmount: response === null || response === void 0 ? void 0 : response.remainingAmount,
      amount: orderAmount
    });
    var responseData = _objectSpread(_objectSpread({}, response), {}, {
      expiresAt: date.toISOString()
    });
    res.json(responseData);
  } catch (error) {
    AdyenLogs.error_log("Failed to create partial payments order.. ".concat(error.toString()));
    res.json({
      error: true
    });
  }
  return next();
}
module.exports = createPartialPaymentsOrder;