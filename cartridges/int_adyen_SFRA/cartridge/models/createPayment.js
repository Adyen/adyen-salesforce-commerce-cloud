"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
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