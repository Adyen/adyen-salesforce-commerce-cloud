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

    I.switchTo('//*[@id="card"]/div/div[2]/div[2]/div[1]/label/span[2]/span/iframe');
    I.seeElementInDOM('//*[@id="encryptedCardNumber"]');
    I.fillField('//*[@id="encryptedCardNumber"]', cardSuccess.cardNumber);
    I.switchTo();

    // I.waitForElement('.adyen-checkout__card__exp-date__input');
    I.switchTo('//*[@id="card"]/div/div[2]/div[2]/div[2]/div[1]/label/span[2]/span/iframe');
    I.seeElementInDOM('//*[@id="encryptedExpiryDate"]');
    I.fillField('//*[@id="encryptedExpiryDate"]', cardSuccess.expiryDate);
    I.switchTo();

    I.switchTo('//*[@id="card"]/div/div[2]/div[2]/div[2]/div[2]/label/span[2]/span/iframe');
    I.seeElementInDOM('//*[@id="encryptedSecurityCode"]');
    I.fillField('//*[@id="encryptedSecurityCode"]', cardSuccess.cvc);
    I.switchTo();
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