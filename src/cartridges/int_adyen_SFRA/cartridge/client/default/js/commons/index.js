const store = require('../../../../store');

module.exports.onFieldValid = function onFieldValid(data) {
  if (data.endDigits) {
    store.endDigits = data.endDigits;
    document.querySelector('#cardNumber').value = store.maskedCardNumber;
  }
};

module.exports.onBrand = function onBrand(brandObject) {
  document.querySelector('#cardType').value = brandObject.brand;
};

/**
 * Makes an ajax call to the controller function CreateSession
 */
module.exports.createSession = async function createSession() {
  return $.ajax({
    url: 'Adyen-Sessions',
    type: 'get',
  });
};

/**
 * Makes an ajax call to the controller function FetchGiftCards
 */
module.exports.fetchGiftCards = async function fetchGiftCards() {
  return $.ajax({
    url: 'Adyen-fetchGiftCards',
    type: 'get',
  });
};
