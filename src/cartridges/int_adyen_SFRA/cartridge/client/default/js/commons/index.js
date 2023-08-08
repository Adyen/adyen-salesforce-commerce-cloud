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
    url: window.sessionsUrl,
    type: 'get',
  });
};

/**
 * Makes an ajax call to the controller function FetchGiftCards
 */
module.exports.fetchGiftCards = async function fetchGiftCards() {
  return $.ajax({
    url: window.fetchGiftCards,
    type: 'get',
  });
};

module.exports.checkIfExpressMethodsAreReady =
  function checkIfExpressMethodsAreReady() {
    const expressMethodsConfig = {
      applepay: window.isApplePayExpressEnabled === 'true',
      amazonpay: window.isAmazonPayExpressEnabled === 'true',
    };
    let enabledExpressMethods = [];
    Object.keys(expressMethodsConfig).forEach((key) => {
      if (expressMethodsConfig[key]) {
        enabledExpressMethods.push(key);
      }
    });
    enabledExpressMethods = enabledExpressMethods.sort();
    const loadedExpressMethods =
      window.loadedExpressMethods && window.loadedExpressMethods.length
        ? window.loadedExpressMethods.sort()
        : [];
    const areAllMethodsReady =
      JSON.stringify(enabledExpressMethods) ===
      JSON.stringify(loadedExpressMethods);
    if (!enabledExpressMethods.length || areAllMethodsReady) {
      document
        .getElementById('express-loader-container')
        ?.classList.add('hidden');
      document.getElementById('express-container')?.classList.remove('hidden');
    }
  };

module.exports.updateLoadedExpressMethods = function updateLoadedExpressMethods(
  method,
) {
  if (!window.loadedExpressMethods) {
    window.loadedExpressMethods = [];
  }
  if (!window.loadedExpressMethods.includes(method)) {
    window.loadedExpressMethods.push(method);
  }
};
