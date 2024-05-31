"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var _require = require('*/cartridge/adyen/config/constants'),
  PAYMENTMETHODS = _require.PAYMENTMETHODS;
var adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
var paypalHelper = require('*/cartridge/adyen/utils/paypalHelper');
function updateShippingAddress(currentBasket, address) {
  if (address) {
    var _currentBasket$getDef = currentBasket.getDefaultShipment(),
      shippingAddress = _currentBasket$getDef.shippingAddress;
    Transaction.wrap(function () {
      if (!shippingAddress) {
        shippingAddress = currentBasket.getDefaultShipment().createShippingAddress();
      }
      shippingAddress.setCity(address === null || address === void 0 ? void 0 : address.city);
      shippingAddress.setPostalCode(address === null || address === void 0 ? void 0 : address.postalCode);
      shippingAddress.setStateCode(address === null || address === void 0 ? void 0 : address.stateCode);
      shippingAddress.setCountryCode(address === null || address === void 0 ? void 0 : address.countryCode);
    });
  }
}
/**
 * Make a request to Adyen to get shipping methods
 */
function callGetShippingMethods(req, res, next) {
  try {
    var _JSON$parse = JSON.parse(req.body),
      address = _JSON$parse.address,
      currentPaymentData = _JSON$parse.currentPaymentData,
      paymentMethodType = _JSON$parse.paymentMethodType;
    var currentBasket = BasketMgr.getCurrentBasket();
    if (!currentBasket) {
      res.json({
        error: true,
        redirectUrl: URLUtils.url('Cart-Show').toString()
      });
      return next();
    }
    updateShippingAddress(currentBasket, address);
    currentBasket.updateTotals();
    var currentShippingMethodsModels = AdyenHelper.getApplicableShippingMethods(currentBasket.getDefaultShipment(), address);
    if (!(currentShippingMethodsModels !== null && currentShippingMethodsModels !== void 0 && currentShippingMethodsModels.length)) {
      throw new Error('No applicable shipping methods found');
    }
    var response = {};
    if (paymentMethodType === PAYMENTMETHODS.PAYPAL) {
      var paypalUpdateOrderResponse = adyenCheckout.doPaypalUpdateOrderCall(paypalHelper.createPaypalUpdateOrderRequest(session.privacy.pspReference, currentBasket, currentShippingMethodsModels, currentPaymentData));
      AdyenLogs.info_log("Paypal Order Update Call: ".concat(paypalUpdateOrderResponse.status));
      response = _objectSpread(_objectSpread({}, response), paypalUpdateOrderResponse);
    }
    response.shippingMethods = currentShippingMethodsModels;
    res.json(response);
    throw new Error('No applicable shipping methods found');
    return next();
  } catch (error) {
    AdyenLogs.error_log('Failed to fetch shipping methods', error);
    res.setStatusCode(500);
    res.json({
      errorMessage: Resource.msg('error.cannot.find.shipping.methods', 'cart', null)
    });
    return next();
  }
}
module.exports = callGetShippingMethods;
