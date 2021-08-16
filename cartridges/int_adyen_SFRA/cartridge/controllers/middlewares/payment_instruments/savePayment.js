"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var server = require('server');

var Resource = require('dw/web/Resource');

var CustomerMgr = require('dw/customer/CustomerMgr');

var Transaction = require('dw/system/Transaction');

var URLUtils = require('dw/web/URLUtils');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var adyenZeroAuth = require('*/cartridge/scripts/adyenZeroAuth');

var constants = require('*/cartridge/adyenConstants/constants');

var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

var _require = require('*/cartridge/scripts/updateSavedCards'),
    updateSavedCards = _require.updateSavedCards;

function containsValidResultCode(req) {
  return ['Authorised', 'IdentifyShopper', 'ChallengeShopper', 'RedirectShopper'].indexOf(req.resultCode) !== -1;
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

function savePayment(req, res, next) {
  if (!AdyenHelper.getAdyenSecuredFieldsEnabled()) {
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
  }); // Send account edited email

  accountHelpers.sendAccountEditedEmail(customer.profile);
  res.json(getResponseBody(zeroAuthResult.action));
  return this.emit('route:Complete', req, res);
}

module.exports = savePayment;