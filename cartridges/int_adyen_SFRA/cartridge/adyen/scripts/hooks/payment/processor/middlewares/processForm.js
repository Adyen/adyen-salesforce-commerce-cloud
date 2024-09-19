"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var array = require('*/cartridge/scripts/util/array');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
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
    AdyenLogs.error_log('Failed to parse payment form stateData:', error);
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