"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var CartModel = require('*/cartridge/models/cart');
var shippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var _require = require('*/cartridge/adyen/config/constants'),
  PAYMENTMETHODS = _require.PAYMENTMETHODS;
var adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var paypalHelper = require('*/cartridge/adyen/utils/paypalHelper');

/**
 * Make a request to Adyen to select shipping methods
 */
// eslint-disable-next-line complexity
function callSelectShippingMethod(req, res, next) {
  var _JSON$parse = JSON.parse(req.form.data),
    isExpressPdp = _JSON$parse.isExpressPdp,
    shipmentUUID = _JSON$parse.shipmentUUID,
    methodID = _JSON$parse.methodID,
    currentPaymentData = _JSON$parse.currentPaymentData,
    paymentMethodType = _JSON$parse.paymentMethodType;
  var currentBasket = isExpressPdp ? BasketMgr.getTemporaryBasket(session.privacy.temporaryBasketId) : BasketMgr.getCurrentBasket();
  if (!currentBasket) {
    res.json({
      error: true,
      redirectUrl: URLUtils.url('Cart-Show').toString()
    });
    return next();
  }
  try {
    var shipment;
    if (shipmentUUID) {
      shipment = shippingHelper.getShipmentByUUID(currentBasket, shipmentUUID);
    } else {
      shipment = currentBasket.defaultShipment;
    }
    Transaction.wrap(function () {
      shippingHelper.selectShippingMethod(shipment, methodID);
      if (currentBasket && !shipment.shippingMethod) {
        var _shipment;
        throw new Error("cannot set shippingMethod: ".concat(methodID, " for shipment:").concat((_shipment = shipment) === null || _shipment === void 0 ? void 0 : _shipment.UUID));
      }
      basketCalculationHelpers.calculateTotals(currentBasket);
    });
    var response = {};
    if (paymentMethodType === PAYMENTMETHODS.PAYPAL) {
      var currentShippingMethodsModels = AdyenHelper.getApplicableShippingMethods(shipment);
      if (!(currentShippingMethodsModels !== null && currentShippingMethodsModels !== void 0 && currentShippingMethodsModels.length)) {
        throw new Error('No applicable shipping methods found');
      }
      var paypalUpdateOrderResponse = adyenCheckout.doPaypalUpdateOrderCall(paypalHelper.createPaypalUpdateOrderRequest(session.privacy.pspReference, currentBasket, currentShippingMethodsModels, currentPaymentData));
      AdyenLogs.info_log("Paypal Order Update Call: ".concat(paypalUpdateOrderResponse.status));
      response = _objectSpread(_objectSpread({}, response), paypalUpdateOrderResponse);
    }
    var basketModel = new CartModel(currentBasket);
    var grandTotalAmount = {
      value: currentBasket.getTotalGrossPrice().value,
      currency: currentBasket.getTotalGrossPrice().currencyCode
    };
    response = _objectSpread(_objectSpread(_objectSpread({}, response), basketModel), {}, {
      grandTotalAmount: grandTotalAmount
    });
    res.json(response);
  } catch (error) {
    AdyenLogs.error_log('Failed to set shipping method', error);
    res.setStatusCode(500);
    res.json({
      errorMessage: Resource.msg('error.cannot.select.shipping.method', 'cart', null)
    });
  }
  return next();
}
module.exports = callSelectShippingMethod;