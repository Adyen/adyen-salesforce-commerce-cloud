const { httpClient } = require('./httpClient');

/**
 * Makes an ajax call to the controller function FetchGiftCards
 */
module.exports.fetchGiftCards = async function fetchGiftCards() {
  return httpClient({
    method: 'POST',
    url: window.fetchGiftCardsUrl,
  });
};

/**
 * Makes an ajax call to the controller function GetPaymentMethods
 */
module.exports.getPaymentMethods = async function getPaymentMethods() {
  return httpClient({
    method: 'POST',
    url: window.getPaymentMethodsURL,
  });
};

/**
 * Makes an ajax call to the controller function GetExpressPaymentMethods
 */
module.exports.getExpressPaymentMethods =
  async function getExpressPaymentMethods() {
    return httpClient({
      method: 'POST',
      url: window.getExpressPaymentMethodsURL,
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
  return httpClient({
    method: 'POST',
    url: window.createTemporaryBasketUrl,
    data: {
      data: JSON.stringify({
        id: parsedData.id,
        bundledProducts: parsedData.bundledProducts,
        options: parsedData.options,
        selectedQuantity: parsedData.selectedQuantity,
      }),
    },
  });
};

/**
 * Makes an ajax call to the controller function calculatePrice
 */
module.exports.calculateProductPrice = async function calculateProductPrice(
  productId,
  quantity,
) {
  return httpClient({
    method: 'POST',
    url: window.productPriceCalculateUrl,
    data: {
      pid: productId,
      quantity,
    },
  });
};
