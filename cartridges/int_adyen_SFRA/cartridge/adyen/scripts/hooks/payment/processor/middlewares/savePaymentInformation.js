"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var CustomerMgr = require('dw/customer/CustomerMgr');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
function hasValidBillingData(_ref) {
  var storedPaymentUUID = _ref.storedPaymentUUID,
    saveCard = _ref.saveCard,
    paymentMethod = _ref.paymentMethod;
  var isCreditCard = paymentMethod.value === 'CREDIT_CARD';
  return !storedPaymentUUID && saveCard && isCreditCard;
}
function isValidCustomer(_ref2) {
  var authenticated = _ref2.authenticated,
    registered = _ref2.registered;
  return authenticated && registered;
}
function isValid(raw, billingData) {
  return isValidCustomer(raw) && hasValidBillingData(billingData);
}

/**
 * Save the credit card information to login account if save card option is selected
 * @param {Object} req - The request object
 * @param {dw.order.Basket} basket - The current basket
 * @param {Object} billingData - payment information
 */
function savePaymentInformation(req, basket, billingData) {
  var _req$currentCustomer = req.currentCustomer,
    raw = _req$currentCustomer.raw,
    profile = _req$currentCustomer.profile,
    wallet = _req$currentCustomer.wallet;
  if (isValid(raw, billingData)) {
    var customer = CustomerMgr.getCustomerByCustomerNumber(profile.customerNo);
    var saveCardResult = COHelpers.savePaymentInstrumentToWallet(billingData, basket, customer);
    wallet.paymentInstruments.push(_objectSpread(_objectSpread({
      creditCardHolder: saveCardResult.creditCardHolder,
      maskedCreditCardNumber: saveCardResult.maskedCreditCardNumber,
      creditCardType: saveCardResult.creditCardType,
      creditCardExpirationMonth: saveCardResult.creditCardExpirationMonth,
      creditCardExpirationYear: saveCardResult.creditCardExpirationYear,
      UUID: saveCardResult.UUID
    }, 'creditCardNumber' in saveCardResult && {
      creditCardNumber: saveCardResult.creditCardNumber
    }), {}, {
      raw: saveCardResult
    }));
  }
}
module.exports = savePaymentInformation;