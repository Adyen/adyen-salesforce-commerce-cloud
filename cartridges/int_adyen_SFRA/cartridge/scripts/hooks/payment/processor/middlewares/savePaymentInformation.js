"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
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