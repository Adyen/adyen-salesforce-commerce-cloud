"use strict";

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var _require = require('*/cartridge/scripts/updateSavedCards'),
    updateSavedCards = _require.updateSavedCards;

function begin(req, res, next) {
  if (req.currentCustomer.raw.isAuthenticated()) {
    updateSavedCards({
      CurrentCustomer: req.currentCustomer.raw
    });
  }

  var clientKey = AdyenHelper.getAdyenClientKey();
  var environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
  var installments = AdyenHelper.getCreditCardInstallments();
  var adyenClientKey = AdyenHelper.getAdyenClientKey();
  var googleMerchantID = AdyenHelper.getGoogleMerchantID();
  var merchantAccount = AdyenHelper.getAdyenMerchantAccount();
  var cardholderNameBool = AdyenHelper.getAdyenCardholderNameEnabled();
  var paypalIntent = AdyenHelper.getAdyenPayPalIntent();
  var viewData = res.getViewData();
  viewData.adyen = {
    clientKey: clientKey,
    environment: environment,
    installments: installments,
    googleMerchantID: googleMerchantID,
    merchantAccount: merchantAccount,
    cardholderNameBool: cardholderNameBool,
    paypalIntent: paypalIntent,
    adyenClientKey: adyenClientKey
  };
  res.setViewData(viewData);
  next();
}

module.exports = begin;