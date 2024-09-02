"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var Transaction = require('dw/system/Transaction');
var Money = require('dw/value/Money');
var BasketMgr = require('dw/order/BasketMgr');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
function makePartialPayment(req, res, next) {
  try {
    var _response$order;
    var request = JSON.parse(req.body);
    var currentBasket = BasketMgr.getCurrentBasket();
    var paymentMethod = request.paymentMethod,
      partialPaymentsOrder = request.partialPaymentsOrder,
      amount = request.amount,
      giftcardBrand = request.giftcardBrand;
    var partialPaymentRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: amount,
      reference: currentBasket.getUUID(),
      paymentMethod: paymentMethod,
      order: partialPaymentsOrder
    };
    var response = adyenCheckout.doPaymentsCall(null, null, partialPaymentRequest); // no order created yet and no PI needed (for giftcards it will be created on Order level)

    Transaction.wrap(function () {
      session.privacy.giftCardResponse = JSON.stringify(_objectSpread(_objectSpread(_objectSpread({
        giftCardpspReference: response.pspReference,
        orderPSPReference: response.order.pspReference
      }, response.order), response.amount), {}, {
        paymentMethod: response.paymentMethod,
        brand: giftcardBrand
      })); // entire response exceeds string length
    });

    var discountAmount = new Money(response.amount.value, response.amount.currency);
    var remainingAmount = new Money(response.order.remainingAmount.value, response.order.remainingAmount.currency);

    // Update cached session data
    var partialPaymentsOrderData = JSON.parse(session.privacy.partialPaymentData);
    partialPaymentsOrderData.remainingAmount = response === null || response === void 0 ? void 0 : (_response$order = response.order) === null || _response$order === void 0 ? void 0 : _response$order.remainingAmount;
    session.privacy.partialPaymentData = JSON.stringify(partialPaymentsOrderData);
    var divideBy = AdyenHelper.getDivisorForCurrency(remainingAmount);
    response.remainingAmountFormatted = remainingAmount.divide(divideBy).toFormattedString();
    response.discountAmountFormatted = discountAmount.divide(divideBy).toFormattedString();
    res.json(response);
  } catch (error) {
    AdyenLogs.error_log("Failed to create partial payment.. ".concat(error.toString()));
    res.json({
      error: true
    });
  }
  return next();
}
module.exports = makePartialPayment;