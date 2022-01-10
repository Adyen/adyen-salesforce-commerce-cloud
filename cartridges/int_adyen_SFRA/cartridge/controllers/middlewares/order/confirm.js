"use strict";

var OrderMgr = require('dw/order/OrderMgr');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper'); // order-confirm is POST in SFRA v6.0.0. orderID is contained in form.
// This was a GET call with a querystring containing ID in earlier versions.


function getOrderId(req) {
  return req.form && req.form.orderID ? req.form.orderID : req.querystring.ID;
}

function handleAdyenGiving(req, res, order) {
  var clientKey = AdyenHelper.getAdyenClientKey();
  var environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
  var configuredAmounts = AdyenHelper.getDonationAmounts();
  var charityName = AdyenHelper.getAdyenGivingCharityName();
  var charityWebsite = AdyenHelper.getAdyenGivingCharityWebsite();
  var charityDescription = AdyenHelper.getAdyenGivingCharityDescription();
  var adyenGivingBackgroundUrl = AdyenHelper.getAdyenGivingBackgroundUrl();
  var adyenGivingLogoUrl = AdyenHelper.getAdyenGivingLogoUrl();
  var donationAmounts = {
    currency: session.currency.currencyCode,
    values: configuredAmounts
  };
  var viewData = res.getViewData();
  viewData.adyen = {
    clientKey: clientKey,
    environment: environment,
    adyenGivingAvailable: true,
    pspReference: order.custom.Adyen_pspReference,
    donationAmounts: JSON.stringify(donationAmounts),
    charityName: charityName,
    charityDescription: charityDescription,
    charityWebsite: charityWebsite,
    adyenGivingBackgroundUrl: adyenGivingBackgroundUrl,
    adyenGivingLogoUrl: adyenGivingLogoUrl
  };
  res.setViewData(viewData);
}

function confirm(req, res, next) {
  var orderId = getOrderId(req);

  if (orderId) {
    var order = OrderMgr.getOrder(orderId);
    var paymentMethod = order.custom.Adyen_paymentMethod;

    if (AdyenHelper.getAdyenGivingConfig(order) && AdyenHelper.isAdyenGivingAvailable(paymentMethod)) {
      handleAdyenGiving(req, res, order);
    }
  }

  return next();
}

module.exports = confirm;