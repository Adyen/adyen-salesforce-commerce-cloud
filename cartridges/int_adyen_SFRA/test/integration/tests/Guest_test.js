"use strict";

Feature("Credit card");
var config = require("../config");
Scenario("Guest Credit card success", function (I) {
  I.initiatePayment(function () {
    I.setCardDetails(config.cardSuccess);
  });
  I.see("Thank you");
});
Scenario("Guest Credit card 3d success", function (I) {
  I.initiatePayment(function () {
    I.setCardDetails(config.cardSuccess3D);
  });
  I.set3dDetails(config.threeds2DetailsSuccess);
  I.switchTo();
  I.see("Thank you");
});
Scenario("Guest Credit card failed", function (I) {
  I.initiatePayment(function () {
    I.setCardDetails(config.cardFail);
  });
  I.dontSee("Thank you");
});
Scenario("Guest Credit card 3d failed", function (I) {
  I.initiatePayment(function () {
    I.setCardDetails(config.cardFail3D);
  });
  I.set3dDetails(config.threeds2DetailsFail);
  I.switchTo();
  I.dontSee("Thank you");
});
Scenario("Guest iDeal success", function (I) {
  I.initiatePayment(function () {
    I.selectIdealPayment();
    I.selectIssuerSuccess();
  });
  I.see("Thank you");
});
Scenario("Guest iDeal failed", function (I) {
  I.initiatePayment(function () {
    I.selectIdealPayment();
    I.selectIssuerPending();
  });
  I.continueOnHppIdeal();
  I.dontSee("Thank you");
});
Scenario("Multibanco success", function (I) {
  I.amOnPage(config.Storefront.urlEUR);
  I.confirmTrackingConsent();
  I.addProductToCart();
  I.amOnPage(config.Storefront.loginEUR);
  I.checkoutAsGuest(config.Guest, "select.option.country.portugal");
  I.checkoutAsGuestSubmit(config.Guest);
  I.selectMultibanco();
  I.submitPayment();
  I.placeOrder();
  I.see("Merci");
  I.see("Multibanco");
});