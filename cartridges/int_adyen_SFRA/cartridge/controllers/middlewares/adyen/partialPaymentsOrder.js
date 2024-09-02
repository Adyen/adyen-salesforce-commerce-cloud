"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
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
    var currentBasket = BasketMgr.getCurrentBasket();
    var date = addMinutes(constants.GIFTCARD_EXPIRATION_MINUTES);
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

    // Cache order data to reuse at payments
    session.privacy.partialPaymentData = JSON.stringify({
      order: {
        orderData: response === null || response === void 0 ? void 0 : response.orderData,
        pspReference: response === null || response === void 0 ? void 0 : response.pspReference
      },
      remainingAmount: response === null || response === void 0 ? void 0 : response.remainingAmount,
      amount: response === null || response === void 0 ? void 0 : response.amount
    });
    res.json(_objectSpread(_objectSpread({}, response), {}, {
      expiresAt: date.toISOString()
    }));
  } catch (error) {
    AdyenLogs.error_log("Failed to create partial payments order.. ".concat(error.toString()));
  }
  return next();
}
module.exports = createPartialPaymentsOrder;