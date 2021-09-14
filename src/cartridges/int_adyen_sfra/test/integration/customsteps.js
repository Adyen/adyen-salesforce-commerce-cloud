const config = require("./config");

// in this file you can append custom step methods to 'I' object
module.exports = function () {
  return actor({
    initiatePayment(callback) {
      this.amOnPage(config.Storefront.url);
      this.confirmTrackingConsent();
      this.addProductToCart();
      this.amOnPage(config.Storefront.login);
      this.checkoutAsGuest(config.Guest, "Netherlands");
      this.checkoutAsGuestState();
      this.checkoutAsGuestSubmit(config.Guest);
      callback();
      this.submitPayment();
      this.placeOrder();
    },

    confirmTrackingConsent() {
      this.click(".affirm");
    },

    addProductToCart() {
      this.click(".home-main-categories .category-tile");
      this.click(".product .image-container a");
      this.selectOption("#size-1", "10");
      this.click(".add-to-cart");
    },

    checkoutAsGuest(Guest, shippingCountry) {
      this.click(".checkout-as-guest");
      this.fillField("#shippingFirstNamedefault", Guest.guestFirstName);
      this.fillField("#shippingLastNamedefault", Guest.guestLastName);
      this.fillField("#shippingAddressOnedefault", Guest.guestStreet);
      this.fillField("#shippingAddressTwodefault", Guest.guestHouseNumber);
      this.selectOption(".shippingCountry", shippingCountry);
      this.fillField("#shippingAddressCitydefault", Guest.guestCity);
      this.fillField("#shippingZipCodedefault", Guest.guestPostCode);
      this.fillField("#shippingPhoneNumberdefault", Guest.guestPhoneNumber);
    },

    checkoutAsGuestState() {
      this.selectOption(".shippingState", "Non-US/Other");
      this.wait(5);
    },

    checkoutAsGuestSubmit(Guest) {
      this.click(".submit-shipping");
      this.fillField("#email", Guest.guestEmail);
    },

    checkoutLoggedIn(userAccount) {
      this.fillField('input[name="loginEmail"]', userAccount.username);
      this.fillField('input[name="loginPassword"]', userAccount.password);
      this.click('.login button[type="submit"]');
      this.click(".submit-shipping");
      this.fillField("#email", userAccount.username);
    },

    newCardPayment() {
      this.click(".user-payment-instruments .add-payment");
    },

    setCardDetails(card) {
      this.fillField(
        "#card .adyen-checkout__card__holderName input",
        card.holderName
      );

      this.switchTo(".adyen-checkout__card__cardNumber__input iframe");
      this.fillField("#encryptedCardNumber", card.cardNumber);
      this.switchTo();

      this.switchTo(".adyen-checkout__card__exp-date__input iframe");
      this.fillField("#encryptedExpiryDate", card.expiryDate);
      this.switchTo();

      this.switchTo("#card .adyen-checkout__card__cvc__input iframe");
      this.fillField("#encryptedSecurityCode", card.cvc);
      this.switchTo();
    },

    setStoreDetails() {
      this.checkOption("#card .adyen-checkout__store-details input");
    },

    setOneclickCVC(card) {
      this.switchTo(locate(".adyen-checkout__card__cvc__input iframe").first());
      this.fillField("#encryptedSecurityCode", card.cvc);
      this.switchTo();
    },

    set3dDetails(threeds2Details) {
      this.wait(15);
      this.switchTo(".adyen-checkout__threeds2__challenge iframe");
      this.fillField('input[name="answer"]', threeds2Details.password);
      this.click('input[type="submit"]');
    },

    selectIdealPayment() {
      this.click(".adyen-option");
      this.click('input[value="ideal"]');
      this.click("#component_ideal .adyen-checkout__dropdown__button");
    },

    selectMultibanco() {
      this.click(".adyen-option");
      this.click('input[value="multibanco"]');
    },

    selectIssuerSuccess() {
      this.click("#component_ideal .adyen-checkout__dropdown__list li");
    },

    selectIssuerPending() {
      this.click(
        '#component_ideal .adyen-checkout__dropdown__list li[data-value="1160"]'
      );
    },

    submitPayment() {
      this.click(".submit-payment");
    },

    placeOrder() {
      this.click(".place-order");
    },

    continueOnHppIdeal() {
      this.click('input[type="submit"]');
    },
  });
};
