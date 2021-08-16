"use strict";

var cvcFail = '123';
var cvcSuccess = '737';
var expiryDate = '1020';
var mastercard = '5100290029002909';
var mastercard3D = '5454545454545454';
var holdernameSuccess = 'Mastercard Success';
var holdernameFail = 'Mastercard Fail';
var username = 'YOUR_USERNAME';
var password = 'YOUR_PASSWORD';
var password3d = 'password';
var passwordFail = 'passwordFail';
module.exports = {
  Storefront: {
    url: 'https://www.yourstorefront.com?lang=en_US',
    login: '/on/demandware.store/Sites-RefArch-Site/default/Checkout-Login',
    urlEUR: 'https://www.yourstorefront.com?lang=fr_FR',
    loginEUR: '/on/demandware.store/Sites-RefArch-Site/fr_FR/Checkout-Login'
  },
  Guest: {
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
  },
  cardSuccess: {
    holderName: holdernameSuccess,
    cardNumber: mastercard,
    expiryDate: expiryDate,
    cvc: cvcSuccess
  },
  cardSuccess3D: {
    holderName: holdernameSuccess,
    cardNumber: mastercard3D,
    expiryDate: expiryDate,
    cvc: cvcSuccess
  },
  cardFail: {
    holderName: holdernameFail,
    cardNumber: mastercard,
    expiryDate: expiryDate,
    cvc: cvcFail
  },
  cardFail3D: {
    holderName: holdernameFail,
    cardNumber: mastercard3D,
    expiryDate: expiryDate,
    cvc: cvcFail
  },
  threeds2DetailsSuccess: {
    password: password3d
  },
  threeds2DetailsFail: {
    password: passwordFail
  },
  userAccount: {
    username: username,
    password: password
  }
};