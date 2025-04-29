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
var URLUtils = require('dw/web/URLUtils');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var _require = require('*/cartridge/adyen/config/constants'),
  PAYMENTMETHODS = _require.PAYMENTMETHODS;
var adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
var paypalHelper = require('*/cartridge/adyen/utils/paypalHelper');
var Collections = require('*/cartridge/scripts/util/collections');
var shippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
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
function getBasket(isExpressPdp) {
  return isExpressPdp ? BasketMgr.getTemporaryBasket(session.privacy.temporaryBasketId) : BasketMgr.getCurrentBasket();
}
/**
 * Make a request to Adyen to get shipping methods
 */
function callGetShippingMethods(req, res, next) {
  try {
    var _currentShippingMetho;
    var _JSON$parse = JSON.parse(req.form.data),
      address = _JSON$parse.address,
      currentPaymentData = _JSON$parse.currentPaymentData,
      paymentMethodType = _JSON$parse.paymentMethodType,
      isExpressPdp = _JSON$parse.isExpressPdp;
    var currentBasket = getBasket(isExpressPdp);
    if (!currentBasket) {
      res.json({
        error: true,
        redirectUrl: URLUtils.url('Cart-Show').toString()
      });
      return next();
    }
    updateShippingAddress(currentBasket, address);
    var currentShippingMethodsModels = [];
    var shipments = currentBasket.getShipments();
    Collections.forEach(shipments, function (shipment) {
      if (currentShippingMethodsModels.length > 0) return;
      var methods = AdyenHelper.getApplicableShippingMethods(shipment, address);
      Transaction.wrap(function () {
        shippingHelper.selectShippingMethod(shipment);
        basketCalculationHelpers.calculateTotals(currentBasket);
      });
      if (methods && methods.length > 0) {
        currentShippingMethodsModels = methods;
      }
    });
    if (!((_currentShippingMetho = currentShippingMethodsModels) !== null && _currentShippingMetho !== void 0 && _currentShippingMetho.length)) {
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