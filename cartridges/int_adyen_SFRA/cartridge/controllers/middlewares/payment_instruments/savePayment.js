"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
var server = require('server');
var Resource = require('dw/web/Resource');
var CustomerMgr = require('dw/customer/CustomerMgr');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var PaymentMgr = require('dw/order/PaymentMgr');
var adyenZeroAuth = require('*/cartridge/scripts/adyenZeroAuth');
var constants = require('*/cartridge/adyenConstants/constants');
var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
var _require = require('*/cartridge/scripts/updateSavedCards'),
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