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
