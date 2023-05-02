"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var array = require('*/cartridge/scripts/util/array');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
function getCreditCardErrors(req, isCreditCard, paymentForm) {
  if (!req.form.storedPaymentUUID && isCreditCard) {
    // verify credit card form data
    return COHelpers.validateCreditCard(paymentForm);
  }
  return {};
}
function setSessionPrivacy(_ref) {
  var adyenPaymentFields = _ref.adyenPaymentFields;
  session.privacy.adyenFingerprint = adyenPaymentFields.adyenFingerprint.value;
}
function getPaymentInstrument(req, storedPaymentMethodId) {
  var currentCustomer = req.currentCustomer;
  var findById = function findById(item) {
    return storedPaymentMethodId === item.getCreditCardToken();
  };
  var paymentInstruments = AdyenHelper.getCustomer(currentCustomer).getProfile().getWallet().getPaymentInstruments();
  return array.find(paymentInstruments, findById);
}

// process payment information
function getProcessFormResult(paymentMethod, req, viewData) {
  var _req$currentCustomer$ = req.currentCustomer.raw,
    authenticated = _req$currentCustomer$.authenticated,
    registered = _req$currentCustomer$.registered;
  if (paymentMethod.storedPaymentMethodId && authenticated && registered) {
    var paymentInstrument = getPaymentInstrument(req, paymentMethod.storedPaymentMethodId);
    return {
      error: false,
      viewData: _objectSpread(_objectSpread({}, viewData), {}, {
        paymentInformation: _objectSpread(_objectSpread({}, viewData.paymentInformation), {}, {
          cardNumber: paymentInstrument.creditCardNumber,
          cardType: paymentInstrument.creditCardType,
          securityCode: req.form.securityCode,
          expirationMonth: paymentInstrument.creditCardExpirationMonth,
          expirationYear: paymentInstrument.creditCardExpirationYear,
          creditCardToken: paymentInstrument.creditCardToken
        })
      })
    };
  }
  return {
    error: false,
    viewData: viewData
  };
}
function getViewData(viewFormData, paymentForm, isCreditCard, adyenPaymentMethod, adyenIssuerName) {
  return _objectSpread(_objectSpread({}, viewFormData), {}, {
    paymentMethod: {
      value: paymentForm.paymentMethod.value,
      htmlName: paymentForm.paymentMethod.value
    },
    paymentInformation: {
      isCreditCard: isCreditCard,
      cardType: paymentForm.creditCardFields.cardType.value,
      cardNumber: paymentForm.creditCardFields.cardNumber.value,
      adyenPaymentMethod: adyenPaymentMethod,
      adyenIssuerName: adyenIssuerName,
      stateData: paymentForm.adyenPaymentFields.adyenStateData.value,
      partialPaymentsOrder: paymentForm.adyenPaymentFields.adyenPartialPaymentsOrder.value
    },
    saveCard: paymentForm.creditCardFields.saveCard.checked
  });
}
function getPaymentMethodFromForm(paymentForm) {
  try {
    var _paymentForm$adyenPay, _paymentForm$adyenPay2;
    return JSON.parse((_paymentForm$adyenPay = paymentForm.adyenPaymentFields) === null || _paymentForm$adyenPay === void 0 ? void 0 : (_paymentForm$adyenPay2 = _paymentForm$adyenPay.adyenStateData) === null || _paymentForm$adyenPay2 === void 0 ? void 0 : _paymentForm$adyenPay2.value).paymentMethod;
  } catch (error) {
    AdyenLogs.error_log('Failed to parse payment form stateData');
    return {};
  }
}

/**
 * Verifies the required information for billing form is provided.
 * @param {Object} req - The request object
 * @param {Object} paymentForm - the payment form
 * @param {Object} viewFormData - object contains billing form data
 * @returns {Object} an object that has error information or payment information
 */
function processForm(req, paymentForm, viewFormData) {
  var brand = JSON.stringify(req.form.brandCode);
  var isCreditCard = req.form.brandCode === 'scheme' || (brand === null || brand === void 0 ? void 0 : brand.indexOf('storedCard')) > -1;
  var creditCardErrors = getCreditCardErrors(req, isCreditCard, paymentForm);
  if (Object.keys(creditCardErrors).length) {
    return {
      fieldErrors: creditCardErrors,
      error: true
    };
  }
  setSessionPrivacy(paymentForm);
  var _req$form = req.form,
    _req$form$adyenPaymen = _req$form.adyenPaymentMethod,
    adyenPaymentMethod = _req$form$adyenPaymen === void 0 ? null : _req$form$adyenPaymen,
    _req$form$adyenIssuer = _req$form.adyenIssuerName,
    adyenIssuerName = _req$form$adyenIssuer === void 0 ? null : _req$form$adyenIssuer;
  var paymentMethod = getPaymentMethodFromForm(paymentForm);
  var viewData = getViewData(viewFormData, paymentForm, isCreditCard, adyenPaymentMethod, adyenIssuerName);
  return getProcessFormResult(paymentMethod, req, viewData);
}
module.exports = processForm;