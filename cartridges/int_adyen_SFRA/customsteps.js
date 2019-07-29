
// in this file you can append custom step methods to 'I' object

    module.exports = function() {
        return actor({
            addProductToCart: function () {
                this.click('.affirm');
                this.click('.home-main-categories .category-tile');
                this.click('.product .image-container a');
                this.selectOption('Select Size', '6');
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
                this.wait(3);
                this.fillField('#shippingAddressCitydefault', Guest.guestCity);
                this.fillField('#shippingZipCodedefault', Guest.guestPostCode);
                this.fillField('#shippingPhoneNumberdefault', Guest.guestPhoneNumber);
                this.click('.submit-shipping');
                this.fillField('#email', Guest.guestEmail);
            },

            setCardDetails: function (card) {
                this.fillField('#card .adyen-checkout__card__holderName input', card.holderName);

                // this.switchTo('#card .adyen-checkout__card__cardNumber__input iframe');
                // this.fillField('#encryptedCardNumber', card.cardNumber);
                this.executeScript(function() {
                    document.querySelector('#card .adyen-checkout__card__cardNumber__input iframe').setAttribute('id', 'card-number-iframe');
                });
                // pause();
                // this.wait(5);
                // this.waitForElement('#card-number-iframe');
                // this.switchTo('#card-number-iframe');
                // this.wait(5);
                // this.fillField('#encryptedCardNumber', card.cardNumber);
                // this.switchTo();

                this.wait(5);
                this.switchTo('.adyen-checkout__card__cardNumber__input iframe');
                this.waitForElement('#encryptedCardNumber');
                this.fillField('#encryptedCardNumber', card.cardNumber);
                this.switchTo();

                this.wait(5);
                within({frame: "#card .adyen-checkout__card__cardNumber__input iframe"}, () => {
                    pause();
                    this.waitForElement('#encryptedCardNumber');
                  this.fillField('#encryptedCardNumber', card.cardNumber);
                  this.switchTo();
                });
                // document.querySelector('#card .adyen-checkout__card__exp-date__input iframe').setAttribute('name', 'card-exp-iframe');
                // document.querySelector('#card .adyen-checkout__card__cvc__input iframe').setAttribute('name', 'card-cvc-iframe');
                // pause();
                //
                // this.wait(5);
                // this.switchTo('card-exp-iframe');
                // this.fillField('#encryptedExpiryDate', card.expiryDate);
                // this.switchTo();
                // this.wait(5);
                // this.switchTo('card-cvc-iframe');
                // this.fillField('#encryptedSecurityCode', card.cvc);
                // this.switchTo();

                // within({frame: "#card .adyen-checkout__card__exp-date__input iframe"}, () => {
                //   this.fillField('#encryptedExpiryDate', card.expiryDate);
                //   this.switchTo();
                // });
                //
                // this.wait(5);
                // within({frame: "#card .adyen-checkout__card__cardNumber__input iframe"}, () => {
                //   this.fillField('#encryptedCardNumber', card.cardNumber);
                //   this.switchTo();
                // });
                //
                // within({frame: "#card .adyen-checkout__card__cvc__input iframe"}, () => {
                //   this.fillField('#encryptedSecurityCode', card.cvc);
                //   this.switchTo();
                // });

                // within({frame: ".adyen-checkout__card__cvc__input iframe"}, () => {
                //   this.fillField('input.cvc-field', card.cvc);
                // });

                //
                // this.switchTo();
                // this.wait(3);
                // this.switchTo('.adyen-checkout__card__exp-date__input iframe');
                // this.fillField('#encryptedExpiryDate', card.expiryDate);
                // this.switchTo();
                // this.switchTo('.adyen-checkout__card__cvc__input iframe');
                // this.fillField('#encryptedSecurityCode', card.cvc);
                // this.switchTo();
            },

            setExpiryDate: function (card) {
                this.executeScript(function() {
                    document.querySelector('#card .adyen-checkout__card__exp-date__input iframe').setAttribute('id', 'card-exp-iframe');
                });
                this.wait(5);
                this.switchTo('#card-exp-iframe');
                this.fillField('#encryptedExpiryDate', card.expiryDate);
                this.switchTo();

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
                this.click('#component_ideal .adyen-checkout__dropdown__list li');
            },

            submitPayment: function () {
                this.click('.submit-payment');
            },

            placeOrder: function () {
                this.click('.place-order');
            },

            continueOnHppIdeal: function() {
                this.click('input[type="submit"]');
            }


        });
    }
