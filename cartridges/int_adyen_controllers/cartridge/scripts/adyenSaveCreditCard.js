"use strict";

var app = require('app_storefront_controllers/cartridge/scripts/app');
var Transaction = require('dw/system/Transaction');
var constants = require('*/cartridge/adyenConstants/constants');
var adyenZeroAuth = require('*/cartridge/scripts/adyenZeroAuth');
function create() {
  var paymentInformation = app.getForm('adyPaydata');
  var wallet = customer.getProfile().getWallet();
  var paymentInstrument;
  Transaction.wrap(function () {
    paymentInstrument = wallet.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT);
    paymentInstrument.custom.adyenPaymentData = paymentInformation.get('adyenStateData').value();
  });
  Transaction.begin();
  var zeroAuthResult = adyenZeroAuth.zeroAuthPayment(customer, paymentInstrument);
  if (zeroAuthResult.action) {
    return zeroAuthResult.action;
  }
  if (zeroAuthResult.error || zeroAuthResult.resultCode !== constants.RESULTCODES.AUTHORISED) {
    Transaction.rollback();
    return false;
  }
  Transaction.commit();
  return true;
}
module.exports = {
  create: create
};