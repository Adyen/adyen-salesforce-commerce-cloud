"use strict";

var OrderMgr = require('dw/order/OrderMgr');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

// order-confirm is POST in SFRA v6.0.0. orderID and orderToken are contained in form.
// This was a GET call with a querystring containing ID & token in earlier versions.
function getOrderId(req) {
  return req.form && req.form.orderID ? req.form.orderID : req.querystring.ID;
}
function getOrderToken(req) {
  return req.form && req.form.orderToken ? req.form.orderToken : req.querystring.token;
}
function handleAdyenGiving(req, res, order) {
  var clientKey = AdyenConfigs.getAdyenClientKey();
  var environment = AdyenHelper.getCheckoutEnvironment();
  var configuredAmounts = AdyenHelper.getDonationAmounts();
  var charityName = AdyenConfigs.getAdyenGivingCharityName();
  var charityWebsite = AdyenConfigs.getAdyenGivingCharityWebsite();
  var charityDescription = AdyenConfigs.getAdyenGivingCharityDescription();
  var adyenGivingBackgroundUrl = AdyenConfigs.getAdyenGivingBackgroundUrl();
  var adyenGivingLogoUrl = AdyenConfigs.getAdyenGivingLogoUrl();
  var paymentInstrument = order.getPaymentInstruments(AdyenHelper.getOrderMainPaymentInstrumentType(order))[0];
  var donationAmounts = {
    currency: session.currency.currencyCode,
    values: configuredAmounts
  };
  var viewData = res.getViewData();
  viewData.adyen = {
    clientKey: clientKey,
    environment: environment,
    adyenGivingAvailable: true,
    pspReference: paymentInstrument.paymentTransaction.custom.Adyen_pspReference,
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
  var orderToken = getOrderToken(req);
  if (orderId && orderToken) {
    var order = OrderMgr.getOrder(orderId, orderToken);
    var paymentInstrument = order.getPaymentInstruments(AdyenHelper.getOrderMainPaymentInstrumentType(order))[0];
    var paymentMethod = paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod;
    if (AdyenHelper.getAdyenGivingConfig(order) && AdyenHelper.isAdyenGivingAvailable(paymentMethod)) {
      handleAdyenGiving(req, res, order);
    }
  }
  return next();
}
module.exports = confirm;