"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
function getField(name, obj) {
  return obj && _defineProperty({}, name, obj);
}
function getParsedField(name, str) {
  return str && _defineProperty({}, name, JSON.parse(str));
}
function getOrNull(name, obj) {
  return obj ? _defineProperty({}, name, obj) : _defineProperty({}, name, null);
}
module.exports.createSelectedPaymentInstruments = function createSelectedPaymentInstruments(_ref5) {
  var paymentMethod = _ref5.paymentMethod,
    paymentTransaction = _ref5.paymentTransaction,
    custom = _ref5.custom,
    creditCardNumberLastDigits = _ref5.creditCardNumberLastDigits,
    creditCardExpirationMonth = _ref5.creditCardExpirationMonth,
    creditCardExpirationYear = _ref5.creditCardExpirationYear,
    creditCardHolder = _ref5.creditCardHolder,
    creditCardType = _ref5.creditCardType,
    giftCertificateCode = _ref5.giftCertificateCode,
    maskedGiftCertificateCode = _ref5.maskedGiftCertificateCode,
    maskedCreditCardNumber = _ref5.maskedCreditCardNumber;
  var results = _objectSpread(_objectSpread(_objectSpread(_objectSpread(_objectSpread(_objectSpread(_objectSpread(_objectSpread(_objectSpread(_objectSpread({
    paymentMethod: paymentMethod,
    amount: paymentTransaction.amount.value
  }, getField('selectedAdyenPM', custom.adyenPaymentMethod)), getField('selectedIssuerName', custom.adyenIssuerName)), getParsedField('adyenAdditionalPaymentData', custom.adyenAdditionalPaymentData)), getField('adyenAction', custom.adyenAction)), getOrNull('lastFour', creditCardNumberLastDigits)), getOrNull('owner', creditCardHolder)), getOrNull('expirationYear', creditCardExpirationYear)), getOrNull('type', creditCardType)), getOrNull('maskedCreditCardNumber', maskedCreditCardNumber)), getOrNull('expirationMonth', creditCardExpirationMonth));
  if (paymentMethod === 'GIFT_CERTIFICATE') {
    results.giftCertificateCode = giftCertificateCode;
    results.maskedGiftCertificateCode = maskedGiftCertificateCode;
  }
  return results;
};