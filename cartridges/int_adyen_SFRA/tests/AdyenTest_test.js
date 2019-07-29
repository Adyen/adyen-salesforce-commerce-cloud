Feature('Credit card');

var Guest = {
    guestEmail: 'guest@adyen.com',
    guestFirstName: 'Guest',
    guestLastName: 'Test',
    guestStreet: 'Guest street 1',
    guestHouseNumber: '123',
    guestCity: 'Amsterdam',
    guestPostCode: '12321',
    guestCountryCode: 'NL',
    guestPhoneNumber: '0612345679',
    guestDOB: '1990-10-10'
};

var cardSuccess = {
    holderName: "Bas Mastercard",
    cardNumber: '5100290029002909',
    expiryDate: '1020',
    cvc: '737'
};

var cardSuccess3D = {
    holderName: "Bas Mastercard",
    cardNumber: '5454545454545454',
    expiryDate: '1020',
    cvc: '737'
};

var cardFail = {
    holderName: "Bas Mastercard",
    cardNumber: '5100290029002909',
    expiryDate: '1020',
    cvc: '123'
};

var cardFail3D = {
    holderName: "Bas Mastercard",
    cardNumber: '5454545454545454',
    expiryDate: '1020',
    cvc: '123'
};

Scenario('Credit card success', (I) => {
    I.amOnPage('https://adyen02-tech-prtnr-eu04-dw.demandware.net/s/RefArch/home?lang=en_US');
    I.addProductToCart();
    I.amOnPage('/on/demandware.store/Sites-RefArch-Site/default/Checkout-Login');
    I.checkoutAsGuest(Guest);
    //I.setCardDetails(cardSuccess);
    //I.setExpiryDate(cardSuccess);
    // I.switchTo();
    // // I.waitForElement('.adyen-checkout__card__cardNumber__input');
    // I.switchTo('.adyen-checkout__card__exp-date__input iframe');
    // I.fillField('#encryptedExpiryDate', cardSuccess.expiryDate);

    // within({frame: ".adyen-checkout__card__cardNumber__input iframe"}, () => {
    //     I.fillField('#encryptedCardNumber', cardSuccess.cardNumber);
    // });

    I.executeScript(function() {
        document.querySelector('#card .adyen-checkout__card__cvc__input iframe').setAttribute('id', 'card-cvc-iframe');
    });

    I.fillField('#card .adyen-checkout__card__holderName input', cardSuccess.holderName);

    I.switchTo('.adyen-checkout__card__cardNumber__input iframe');
    I.waitForElement('#encryptedCardNumber');
    I.fillField('#encryptedCardNumber', cardSuccess.cardNumber);
    I.wait(5);

    I.switchTo();

    // I.waitForElement('.adyen-checkout__card__exp-date__input');
    I.switchTo('//*[@id="encryptedExpiryDate"]');
    I.waitForElement('#encryptedExpiryDate');
    I.fillField('#encryptedExpiryDate', cardSuccess.expiryDate);

    I.waitForElement('.adyen-checkout__card__exp-cvc');
    I.switchTo('.adyen-checkout__card__exp-cvc .adyen-checkout__card__cvc__input iframe');
    I.wait(5);
    I.waitForElement('#encryptedSecurityCode');
    I.fillField('#encryptedSecurityCode', cardSuccess.cvc);
    // within({frame: "#card-cvc-iframe"}, () => {
    //     I.wait(5);
    //     I.waitForVisible('#encryptedSecurityCode');
    //     I.fillField('#encryptedSecurityCode', cardSuccess.cvc);
    // });
    // I.wait(5);
    // I.waitForElement('#encryptedSecurityCode');
    // I.fillField('#encryptedSecurityCode', cardSuccess.cvc);



    //I.switchTo();
    I.submitPayment();
    I.placeOrder();

 });

// Scenario('iDeal success', (I) => {
//     I.amOnPage('https://adyen02-tech-prtnr-eu04-dw.demandware.net/s/RefArch/home?lang=en_US');
//     I.addProductToCart();
//     I.amOnPage('/on/demandware.store/Sites-RefArch-Site/default/Checkout-Login');
//     I.checkoutAsGuest(Guest);
//     I.selectIdealPayment();
//     I.selectIssuerSuccess();
//     I.submitPayment();
//     I.placeOrder();
//     I.wait(5);
//     I.continueOnHppIdeal();
//     I.see('Thank you');
// });
//
// Scenario('iDeal fail', (I) => {
//     I.amOnPage('https://adyen02-tech-prtnr-eu04-dw.demandware.net/s/RefArch/home?lang=en_US');
//     I.addProductToCart();
//     I.amOnPage('/on/demandware.store/Sites-RefArch-Site/default/Checkout-Login');
//     I.checkoutAsGuest(Guest);
//     I.selectIdealPayment();
//     I.selectIssuerPending();
//     I.submitPayment();
//     I.placeOrder();
//     I.wait(5);
//     I.continueOnHppIdeal();
//     I.see('Payment not submitted')
// });