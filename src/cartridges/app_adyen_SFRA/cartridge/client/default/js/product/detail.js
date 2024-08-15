const applePayExpressModule = require('../adyen_express/applepay/common');

function getValueForCurrency(amount, currency) {
  const value = Math.round(amount * 10 ** window.fractionDigits);
  return { value, currency };
}

module.exports = function updateAddToCart() {
  $('body').on('product:updateAddToCart', (e, response) => {
    if (response.product.readyToOrder) {
      const { price, selectedQuantity } = response.product;
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
  });
};
