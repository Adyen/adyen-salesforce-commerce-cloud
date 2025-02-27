const $ = require('jquery');
const store = require('../../../../store');
const { PAYPAL, APPLE_PAY, AMAZON_PAY, GOOGLE_PAY } = require('../constants');

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
 * Makes an ajax call to the controller function FetchGiftCards
 */
module.exports.fetchGiftCards = async function fetchGiftCards() {
  return $.ajax({
    url: window.fetchGiftCardsUrl,
    type: 'post',
    data: {
      csrf_token: $('#adyen-token').val(),
    },
  });
};

/**
 * Makes an ajax call to the controller function GetPaymentMethods
 */
module.exports.getPaymentMethods = async function getPaymentMethods() {
  return $.ajax({
    url: window.getPaymentMethodsURL,
    type: 'post',
    data: {
      csrf_token: $('#adyen-token').val(),
    },
  });
};

module.exports.getConnectedTerminals = async function getConnectedTerminals() {
  return $.ajax({
    url: window.getConnectedTerminalsURL,
    type: 'post',
    data: {
      csrf_token: $('#adyen-token').val(),
      data: JSON.stringify({
        storeId: $('#storeList').val(),
      }),
    },
  });
};

/**
 * Makes an ajax call to the controller function createTemporaryBasket
 */
module.exports.createTemporaryBasket = async function createTemporaryBasket() {
  const productForm = document.getElementById('express-product-form');
  const data = new FormData(productForm);
  const dataFromEntries = Object.fromEntries(data.entries());
  const parsedData = JSON.parse(dataFromEntries['selected-express-product']);
  return $.ajax({
    url: window.createTemporaryBasketUrl,
    type: 'post',
    data: {
      csrf_token: $('#adyen-token').val(),
      data: JSON.stringify({
        id: parsedData.id,
        bundledProducts: parsedData.bundledProducts,
        options: parsedData.options,
        selectedQuantity: parsedData.selectedQuantity,
      }),
    },
  });
};

module.exports.checkIfExpressMethodsAreReady =
  function checkIfExpressMethodsAreReady() {
    const expressMethodsConfig = {
      [APPLE_PAY]: window.isApplePayExpressEnabled === 'true',
      [AMAZON_PAY]: window.isAmazonPayExpressEnabled === 'true',
      [PAYPAL]: window.isPayPalExpressEnabled === 'true',
      [GOOGLE_PAY]: window.isGooglePayExpressEnabled === 'true',
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
