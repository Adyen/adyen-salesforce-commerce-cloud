Feature('Credit card');
var config = require('../config');

Scenario('Guest Credit card success', (I) => {
    I.amOnPage(config.Storefront.url);
    I.confirmTrackingConsent();
    I.addProductToCart();
    I.amOnPage(config.Storefront.login);
    I.checkoutAsGuest(config.Guest, "Netherlands");
    I.checkoutAsGuestState();
    I.checkoutAsGuestSubmit(config.Guest);
    I.setCardDetails(config.cardSuccess);
    I.submitPayment();
    I.placeOrder();
    I.see("Thank you");
 });

Scenario('Guest Credit card 3d success', (I) => {
    I.amOnPage(config.Storefront.url);
    I.confirmTrackingConsent();
    I.addProductToCart();
    I.amOnPage(config.Storefront.login);
    I.checkoutAsGuest(config.Guest, "Netherlands");
    I.checkoutAsGuestState();
    I.checkoutAsGuestSubmit(config.Guest);
    I.setCardDetails(config.cardSuccess3D);
    I.submitPayment();
    I.placeOrder();
    I.set3dDetails(config.threeds2DetailsSuccess);
    I.switchTo();
    I.see('Thank you');
});


Scenario('Guest Credit card failed', (I) => {
    I.amOnPage(config.Storefront.url);
    I.confirmTrackingConsent();
    I.addProductToCart();
    I.amOnPage(config.Storefront.login);
    I.checkoutAsGuest(config.Guest, "Netherlands");
    I.checkoutAsGuestState();
    I.checkoutAsGuestSubmit(config.Guest);
    I.setCardDetails(config.cardFail);
    I.submitPayment();
    I.placeOrder();
    I.dontSee("Thank you");
});


Scenario('Guest Credit card 3d failed', (I) => {
    I.amOnPage(config.Storefront.url);
    I.confirmTrackingConsent();
    I.addProductToCart();
    I.amOnPage(config.Storefront.login);
    I.checkoutAsGuest(config.Guest, "Netherlands");
    I.checkoutAsGuestState();
    I.checkoutAsGuestSubmit(config.Guest);
    I.setCardDetails(config.cardFail3D);
    I.submitPayment();
    I.placeOrder();
    I.set3dDetails(config.threeds2DetailsFail);
    I.dontSee("Thank you");
});


Scenario('iDeal success', (I) => {
    I.amOnPage(config.Storefront.url);
    I.confirmTrackingConsent();
    I.addProductToCart();
    I.amOnPage(config.Storefront.login);
    I.checkoutAsGuest(config.Guest, "Netherlands");
    I.checkoutAsGuestState();
    I.checkoutAsGuestSubmit(config.Guest);
    I.selectIdealPayment();
    I.selectIssuerSuccess();
    I.submitPayment();
    I.placeOrder();
    I.wait(5);
    I.continueOnHppIdeal();
    I.see('Thank you');
});

Scenario('iDeal fail', (I) => {
    I.amOnPage(config.Storefront.url);
    I.confirmTrackingConsent();
    I.addProductToCart();
    I.amOnPage(config.Storefront.login);
    I.checkoutAsGuest(config.Guest, "Netherlands");
    I.checkoutAsGuestState();
    I.checkoutAsGuestSubmit(config.Guest);
    I.selectIdealPayment();
    I.selectIssuerPending();
    I.submitPayment();
    I.placeOrder();
    I.wait(5);
    I.continueOnHppIdeal();
    I.dontSee("Thank you");
});

Scenario('Multibanco success', (I) => {
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

