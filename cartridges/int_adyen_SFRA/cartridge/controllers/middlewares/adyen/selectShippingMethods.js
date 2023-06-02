"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return _typeof(key) === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (_typeof(input) !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (_typeof(res) !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var BasketMgr = require('dw/order/BasketMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var CartModel = require('*/cartridge/models/cart');
var shippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

/**
 * Make a request to Adyen to select shipping methods
 */
// eslint-disable-next-line complexity
function callSelectShippingMethod(req, res, next) {
  var currentBasket = BasketMgr.getCurrentBasket();
  if (!currentBasket) {
    res.json({
      error: true,
      redirectUrl: URLUtils.url('Cart-Show').toString()
    });
    return next();
  }
  var error = false;
  var shipUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
  var methodID = req.querystring.methodID || req.form.methodID;
  var shipment;
  if (shipUUID) {
    shipment = shippingHelper.getShipmentByUUID(currentBasket, shipUUID);
  } else {
    shipment = currentBasket.defaultShipment;
  }
  Transaction.wrap(function () {
    shippingHelper.selectShippingMethod(shipment, methodID);
    if (currentBasket && !shipment.shippingMethod) {
      error = true;
      return;
    }
    basketCalculationHelpers.calculateTotals(currentBasket);
  });
  if (!error) {
    var basketModel = new CartModel(currentBasket);
    var grandTotalAmount = {
      value: currentBasket.getTotalGrossPrice().value,
      currency: currentBasket.getTotalGrossPrice().currencyCode
    };
    res.json(_objectSpread(_objectSpread({}, basketModel), {}, {
      grandTotalAmount: grandTotalAmount
    }));
  } else {
    res.setStatusCode(500);
    res.json({
      errorMessage: Resource.msg('error.cannot.select.shipping.method', 'cart', null)
    });
  }
  return next();
}
module.exports = callSelectShippingMethod;