"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var server = require('server');
var Resource = require('dw/web/Resource');
var CustomerMgr = require('dw/customer/CustomerMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var PaymentMgr = require('dw/order/PaymentMgr');
var adyenZeroAuth = require('*/cartridge/adyen/scripts/payments/adyenZeroAuth');
var constants = require('*/cartridge/adyen/config/constants');
var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
var _require = require('*/cartridge/adyen/scripts/payments/updateSavedCards'),
  updateSavedCards = _require.updateSavedCards;
var _require2 = require('*/cartridge/controllers/middlewares/payment_instruments/paymentProcessorIDs'),
  paymentProcessorIDs = _require2.paymentProcessorIDs;
function containsValidResultCode(req) {
  return [constants.RESULTCODES.AUTHORISED, constants.RESULTCODES.IDENTIFYSHOPPER, constants.RESULTCODES.CHALLENGESHOPPER, constants.RESULTCODES.REDIRECTSHOPPER].indexOf(req.resultCode) !== -1;
}
function createPaymentInstrument(customer) {
  var paymentInstrument;
  var paymentForm = server.forms.getForm('creditCard');
  var wallet = customer.getProfile().getWallet();
  Transaction.wrap(function () {
    paymentInstrument = wallet.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT);
    paymentInstrument.custom.adyenPaymentData = paymentForm.adyenStateData.value;
  });
  return paymentInstrument;
}
function getResponseBody(action) {
  return _objectSpread({
    success: true,
    redirectUrl: URLUtils.url('PaymentInstruments-List').toString()
  }, action && {
    redirectAction: action
  });
}
function isAdyen() {
  var _PaymentMgr$getPaymen, _PaymentMgr$getPaymen2;
  return paymentProcessorIDs.indexOf((_PaymentMgr$getPaymen = PaymentMgr.getPaymentMethod('CREDIT_CARD')) === null || _PaymentMgr$getPaymen === void 0 ? void 0 : (_PaymentMgr$getPaymen2 = _PaymentMgr$getPaymen.getPaymentProcessor()) === null || _PaymentMgr$getPaymen2 === void 0 ? void 0 : _PaymentMgr$getPaymen2.getID()) > -1 || PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_COMPONENT).isActive();
}
function savePayment(req, res, next) {
  if (!isAdyen()) {
    return next();
  }
  var customer = CustomerMgr.getCustomerByCustomerNumber(req.currentCustomer.profile.customerNo);
  Transaction.begin();
  var zeroAuthResult = adyenZeroAuth.zeroAuthPayment(customer, createPaymentInstrument(customer));
  if (zeroAuthResult.error || !containsValidResultCode(zeroAuthResult)) {
    Transaction.rollback();
    res.json({
      success: false,
      error: [Resource.msg('error.card.information.error', 'creditCard', null)]
    });
    return this.emit('route:Complete', req, res);
  }
  Transaction.commit();
  updateSavedCards({
    CurrentCustomer: req.currentCustomer.raw
  });

  // Send account edited email
  accountHelpers.sendAccountEditedEmail(customer.profile);
  res.json(getResponseBody(zeroAuthResult.action));
  return this.emit('route:Complete', req, res);
}
module.exports = savePayment;