"use strict";

var adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var _require = require('*/cartridge/scripts/updateSavedCards'),
    updateSavedCards = _require.updateSavedCards;

function begin(req, res, next) {
  if (req.currentCustomer.raw.isAuthenticated()) {
    updateSavedCards({
      CurrentCustomer: req.currentCustomer.raw
    });
  }

  var protocol = req.https ? 'https' : 'http';
  var originKey = adyenGetOriginKey.getOriginKeyFromRequest(protocol, req.host);
  var environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
  var installments = AdyenHelper.getCreditCardInstallments();
  var paypalMerchantID = AdyenHelper.getPaypalMerchantID();
  var googleMerchantID = AdyenHelper.getGoogleMerchantID();
  var merchantAccount = AdyenHelper.getAdyenMerchantAccount();
  var cardholderNameBool = AdyenHelper.getAdyenCardholderNameEnabled();
  var paypalIntent = AdyenHelper.getAdyenPayPalIntent();
  var viewData = res.getViewData();
  viewData.adyen = {
    originKey: originKey,
    environment: environment,
    installments: installments,
    paypalMerchantID: paypalMerchantID,
    googleMerchantID: googleMerchantID,
    merchantAccount: merchantAccount,
    cardholderNameBool: cardholderNameBool,
    paypalIntent: paypalIntent
  };
  res.setViewData(viewData);
  next();
}

module.exports = begin;