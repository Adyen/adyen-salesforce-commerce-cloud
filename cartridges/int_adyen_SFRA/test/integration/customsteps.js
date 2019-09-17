
// in this file you can append custom step methods to 'I' object

module.exports = function() {
    return actor({
        confirmTrackingConsent: function(){
            this.click('.affirm');
        },

        addProductToCart: function () {
            this.click('.home-main-categories .category-tile');
            this.click('.product .image-container a');
            this.selectOption('Select Size', '8');
            this.click('.add-to-cart');
        },

        checkoutAsGuest: function (Guest) {
            this.click('.checkout-as-guest');
            this.fillField('#shippingFirstNamedefault', Guest.guestFirstName);
            this.fillField('#shippingLastNamedefault', Guest.guestLastName);
            this.fillField('#shippingAddressOnedefault', Guest.guestStreet);
            this.fillField('#shippingAddressTwodefault', Guest.guestHouseNumber);
            this.selectOption('.shippingCountry', 'Netherlands');
            this.selectOption('.shippingState', 'Non-US/Other');
            this.wait(2);
            this.fillField('#shippingAddressCitydefault', Guest.guestCity);
            this.fillField('#shippingZipCodedefault', Guest.guestPostCode);
            this.fillField('#shippingPhoneNumberdefault', Guest.guestPhoneNumber);
            this.click('.submit-shipping');
            this.fillField('#email', Guest.guestEmail);
        },

        checkoutLoggedIn: function (userAccount) {
            this.fillField('input[name="loginEmail"]', userAccount.username);
            this.fillField('input[name="loginPassword"]', userAccount.password);
            this.click('.login button[type="submit"]');
            this.click('.submit-shipping');
            this.fillField('#email', userAccount.username);
        },

        newCardPayment: function () {
            this.click('.user-payment-instruments .add-payment');
        },

        setCardDetails: function (card) {
            this.fillField('#card .adyen-checkout__card__holderName input', card.holderName);

            this.switchTo('.adyen-checkout__card__cardNumber__input iframe');
            this.fillField('#encryptedCardNumber', card.cardNumber);
            this.switchTo();

            this.switchTo('.adyen-checkout__card__exp-date__input iframe');
            this.fillField('#encryptedExpiryDate', card.expiryDate);
            this.switchTo();

            this.switchTo('#card .adyen-checkout__card__cvc__input iframe');
            this.fillField('#encryptedSecurityCode', card.cvc);
            this.switchTo();
        },

        setStoreDetails: function() {
            this.checkOption('#card .adyen-checkout__store-details input');
        },

        setOneclickCVC: function(card) {
            this.switchTo(locate('.adyen-checkout__card__cvc__input iframe').first());
            this.fillField('#encryptedSecurityCode', card.cvc);
            this.switchTo();
        },

        set3dDetails: function (threeds2Details) {
            this.wait(5);
            this.switchTo('.adyen-checkout__threeds2__challenge iframe');
            this.fillField('input[name="answer"]', threeds2Details.password);
            this.click('input[type="submit"]');
        },

        selectIdealPayment: function () {
            this.click('.adyen-option');
            this.click('input[value="ideal"]');
            this.click('#component_ideal .adyen-checkout__dropdown__button');

        },

        selectIssuerSuccess: function () {
            this.click('#component_ideal .adyen-checkout__dropdown__list li');
        },

        selectIssuerPending: function () {
            this.click('#component_ideal .adyen-checkout__dropdown__list li[data-value="1160"]');
        },

        submitPayment: function () {
            this.click('.submit-payment');
        },

        placeOrder: function () {
            this.click('.place-order');
        },

        continueOnHppIdeal: function () {
            this.click('input[type="submit"]');
        }


    });
}
