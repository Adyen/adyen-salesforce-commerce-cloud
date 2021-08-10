"use strict";

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

function savePayment(req, res, next) {
  if (!AdyenHelper.getAdyenSecuredFieldsEnabled()) {
    return next();
  }

  var paymentForm = server.forms.getForm('creditCard');
  var customer = CustomerMgr.getCustomerByCustomerNumber(req.currentCustomer.profile.customerNo);
  var paymentInstrument;
  var wallet = customer.getProfile().getWallet();
  Transaction.wrap(function () {
    paymentInstrument = wallet.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT);
    paymentInstrument.custom.adyenPaymentData = paymentForm.adyenStateData.value;
  });
  Transaction.begin();
  var zeroAuthResult = adyenZeroAuth.zeroAuthPayment(customer, paymentInstrument);

  if (zeroAuthResult.error || zeroAuthResult.resultCode !== 'Authorised') {
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
  res.json({
    success: true,
    redirectUrl: URLUtils.url('PaymentInstruments-List').toString()
  });
  return this.emit('route:Complete', req, res);
}

module.exports = savePayment;