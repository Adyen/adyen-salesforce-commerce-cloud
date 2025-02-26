"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var PaymentMgr = require('dw/order/PaymentMgr');
var adyenTerminalApi = require('*/cartridge/adyen/scripts/pos/adyenTerminalApi');
var constants = require('*/cartridge/adyen/config/constants');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
function getConnectedTerminals(req, res, next) {
  try {
    var requestObject = {};
    var getTerminalRequest = {};
    var _JSON$parse = JSON.parse(req.form.data),
      storeId = _JSON$parse.storeId;
    var activatedStores = AdyenConfigs.getAdyenActiveStoreId();
    getTerminalRequest.merchantAccount = AdyenConfigs.getAdyenMerchantAccount();
    getTerminalRequest.store = storeId;
    requestObject.request = getTerminalRequest;
    if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive() && activatedStores.includes(storeId)) {
      var response = adyenTerminalApi.executeCall(constants.SERVICE.CONNECTEDTERMINALS, requestObject);
      res.json(_objectSpread({}, response));
    }
  } catch (error) {
    AdyenLogs.fatal_log('/getConnectedTerminals call failed', error);
    res.json({
      error: true
    });
  }
  return next();
}
module.exports = getConnectedTerminals;