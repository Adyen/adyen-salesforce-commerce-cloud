const applePayExpressModule = require('../applePayExpressCommon');

function getValueForCurrency(amount, currency) {
  const value = Math.round(amount * 10 ** window.fractionDigits);
  return { value, currency };
}

function renderApplePayButton(product) {
  if (product.readyToOrder) {
    const { price, selectedQuantity } = product;
    const { value, currency } = price.sales;
    const amount = getValueForCurrency(value * selectedQuantity, currency);
    window.basketAmount = JSON.stringify(amount);
    applePayExpressModule.init();
  } else {
    const element = document.getElementById('applepay-pdp');
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
  }
}

$(document).ready(() => {
  renderApplePayButton(window.initialProduct);
});

module.exports = function updateAddToCart() {
  $('body').on('product:updateAddToCart', (e, response) => {
    renderApplePayButton(response.product);
  });
};
