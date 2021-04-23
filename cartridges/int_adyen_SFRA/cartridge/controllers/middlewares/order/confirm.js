"use strict";

var OrderMgr = require('dw/order/OrderMgr');

var adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function confirm(req, res, next) {
  var order = OrderMgr.getOrder(req.querystring.ID);
  var paymentMethod = order.custom.Adyen_paymentMethod;

  if (AdyenHelper.getAdyenGivingEnabled() && AdyenHelper.isAdyenGivingAvailable(paymentMethod)) {
    var protocol = req.https ? 'https' : 'http';
    var originKey = adyenGetOriginKey.getOriginKeyFromRequest(protocol, req.host);
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
      originKey: originKey,
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

  return next();
}

module.exports = confirm;