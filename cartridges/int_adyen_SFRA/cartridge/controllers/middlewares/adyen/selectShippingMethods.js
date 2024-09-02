"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
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