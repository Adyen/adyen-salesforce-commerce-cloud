const applePayExpressModule = require('../applePayExpress');
const { APPLE_PAY } = require('../constants');
const { getPaymentMethods } = require('../commons');

let paymentMethodsResponse;

function getProductForm(product) {
  const $productInputEl = document.createElement('input');
  $productInputEl.setAttribute('id', 'selected-express-product');
  $productInputEl.setAttribute('name', 'selected-express-product');
  $productInputEl.setAttribute('type', 'hidden');
  $productInputEl.setAttribute('data-pid', `${product.id}`);
  $productInputEl.setAttribute('data-basketId', '');
  $productInputEl.value = JSON.stringify(product);
  const $productForm = document.createElement('form');
  $productForm.setAttribute('id', 'express-product-form');
  $productForm.setAttribute('name', 'express-product-form');
  $productForm.append($productInputEl);
  return $productForm;
}

function getValueForCurrency(amount, currency) {
  const value = Math.round(amount * 10 ** window.fractionDigits);
  return { value, currency };
}

function getExpressPaymentButtons(product) {
  const expressMethodsConfig = {
    [APPLE_PAY]: window.isApplePayExpressOnPdpEnabled === 'true',
  };
  const enabledExpressPaymentButtons = [];
  Object.keys(expressMethodsConfig).forEach((key) => {
    if (expressMethodsConfig[key]) {
      const $container = document.createElement('div');
      $container.setAttribute('id', `${key}-pdp`);
      $container.setAttribute('class', `expressComponent ${key}`);
      $container.setAttribute('data-method', `${key}`);
      $container.setAttribute('data-pid', `${product.id}`);
      enabledExpressPaymentButtons.push($container);
    }
  });
  return enabledExpressPaymentButtons;
}

function renderApplePayButton(paymentMethods) {
  applePayExpressModule.init(paymentMethods);
}

function renderExpressPaymentButtons() {
  $('body').on('product:renderExpressPaymentButtons', (e, response) => {
    const { product = {}, paymentMethods } = response;
    const $expressPaymentButtonsContainer = document.getElementById(
      'express-payment-buttons',
    );
    if (product.readyToOrder && product.available) {
      const { price, selectedQuantity } = product;
      const { value, currency } = price.sales;
      const amount = getValueForCurrency(value * selectedQuantity, currency);
      window.basketAmount = JSON.stringify(amount);
      const expressPaymentButtons = getExpressPaymentButtons(product);
      const $productForm = getProductForm(product);
      $expressPaymentButtonsContainer.replaceChildren(
        ...expressPaymentButtons,
        $productForm,
      );
      renderApplePayButton(paymentMethods);
    } else {
      $expressPaymentButtonsContainer.replaceChildren();
    }
  });
}

async function init() {
  const paymentMethods = await getPaymentMethods();
  paymentMethodsResponse = await paymentMethods.json();
  $('body').on('product:updateAddToCart', (e, response) => {
    $('body').trigger('product:renderExpressPaymentButtons', {
      product: response.product,
      paymentMethods: paymentMethodsResponse,
    });
  });
  $(document).ready(async () => {
    $.spinner().start();
    const dataUrl = $('.quantity-select').find('option:selected').data('url');
    const productVariation = await fetch(dataUrl);
    if (productVariation.ok) {
      const { product } = await productVariation.json();
      $('body').trigger('product:renderExpressPaymentButtons', {
        product,
        paymentMethods: paymentMethodsResponse,
      });
    }
    $.spinner().stop();
  });
}

module.exports = {
  init,
  renderExpressPaymentButtons,
};