"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var BasketMgr = require('dw/order/BasketMgr');
var Money = require('dw/value/Money');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var constants = require('*/cartridge/adyenConstants/constants');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
function getFormattedProperties(checkBalanceResponse, orderAmount) {
  if (checkBalanceResponse.resultCode === 'Success') {
    var remainingAmount = new Money(0, checkBalanceResponse.balance.currency);
    var remainingDivideBy = AdyenHelper.getDivisorForCurrency(remainingAmount);
    var remainingAmountFormatted = remainingAmount.divide(remainingDivideBy).toFormattedString();
    var totalAmount = new Money(orderAmount.value, orderAmount.currency);
    var totalDivideBy = AdyenHelper.getDivisorForCurrency(totalAmount);
    var totalAmountFormatted = totalAmount.divide(totalDivideBy).toFormattedString();
    return {
      remainingAmountFormatted: remainingAmountFormatted,
      totalAmountFormatted: totalAmountFormatted
    };
  }
  return {};
}
function getAddedGiftCards(basket) {
  var _basket$custom;
  return (_basket$custom = basket.custom) !== null && _basket$custom !== void 0 && _basket$custom.adyenGiftCards ? JSON.parse(basket.custom.adyenGiftCards) : null;
}
function callCheckBalance(req, res, next) {
  try {
    var _currentBasket$custom;
    var currentBasket = BasketMgr.getCurrentBasket();
    var orderNo = ((_currentBasket$custom = currentBasket.custom) === null || _currentBasket$custom === void 0 ? void 0 : _currentBasket$custom.adyenGiftCardsOrderNo) || OrderMgr.createOrderNo();
    var giftCardsAdded = getAddedGiftCards(currentBasket);
    var orderAmount = {
      currency: currentBasket.currencyCode,
      value: AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()).value
    };
    var amount = giftCardsAdded ? giftCardsAdded[giftCardsAdded.length - 1].remainingAmount : orderAmount;
    var request = JSON.parse(req.body);
    var paymentMethod = request.paymentMethod ? request.paymentMethod : constants.ACTIONTYPES.GIFTCARD;
    var checkBalanceRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: amount,
      reference: orderNo,
      paymentMethod: paymentMethod
    };
    var checkBalanceResponse = adyenCheckout.doCheckBalanceCall(checkBalanceRequest);
    Transaction.wrap(function () {
      currentBasket.custom.adyenGiftCardsOrderNo = orderNo;
    });
    res.json(_objectSpread(_objectSpread({}, checkBalanceResponse), getFormattedProperties(checkBalanceResponse, orderAmount)));
  } catch (error) {
    AdyenLogs.error_log("Failed to check gift card balance ".concat(error.toString()));
    res.json({
      error: true
    });
  }
  return next();
}
module.exports = callCheckBalance;