const { APPLE_PAY, GOOGLE_PAY } = require('../../constants');
const { getPaymentMethods } = require('../../commons');
const { httpClient } = require('../../commons/httpClient');
const { ApplePay, GooglePay } = require('../paymentMethods');

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

function getPaymentMethodConfig(adyenPaymentMethods, paymentMethodType) {
  return adyenPaymentMethods?.paymentMethods.find(
    (pm) => pm.type === paymentMethodType,
  )?.configuration;
}

function renderApplePayButton() {
  $('body').on(`product:render${APPLE_PAY}Button`, async (e, response) => {
    const {
      paymentMethodsResponse: { AdyenPaymentMethods, applicationInfo } = {},
      button,
    } = response;
    const applePayConfig = getPaymentMethodConfig(
      AdyenPaymentMethods,
      APPLE_PAY,
    );
    if (!applePayConfig) {
      return;
    }
    const applePay = new ApplePay(applePayConfig, applicationInfo, true);
    const applePayComponent = await applePay.getComponent();
    applePayComponent.mount(button);
  });
}

function renderGooglePayButton() {
  $('body').on(`product:render${GOOGLE_PAY}Button`, async (e, response) => {
    const {
      paymentMethodsResponse: { AdyenPaymentMethods, applicationInfo } = {},
      button,
    } = response;
    const googlePayConfig = getPaymentMethodConfig(
      AdyenPaymentMethods,
      GOOGLE_PAY,
    );
    if (!googlePayConfig) {
      return;
    }
    const googlePay = new GooglePay(googlePayConfig, applicationInfo, true);
    const googlePayComponent = await googlePay.getComponent();
    googlePayComponent.mount(button);
  });
}

function getExpressPaymentButtons(product) {
  const expressMethodsConfig = {
    [APPLE_PAY]: window.isApplePayExpressOnPdpEnabled === 'true',
    [GOOGLE_PAY]: window.isGooglePayExpressOnPdpEnabled === 'true',
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

function renderExpressPaymentContainer() {
  $('body').on('product:renderExpressPaymentContainer', (e, response) => {
    const { product = {}, paymentMethodsResponse } = response;
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
      expressPaymentButtons.forEach((button) => {
        const expressType = button.getAttribute('data-method');
        $('body').trigger(`product:render${expressType}Button`, {
          paymentMethodsResponse,
          button,
        });
      });
    } else {
      $expressPaymentButtonsContainer.replaceChildren();
    }
  });
}

async function init() {
  const paymentMethodsResponse = await getPaymentMethods();
  $('body').on('product:updateAddToCart', (e, response) => {
    $('body').trigger('product:renderExpressPaymentContainer', {
      product: response.product,
      paymentMethodsResponse,
    });
  });
  $(document).ready(async () => {
    $.spinner().start();
    const dataUrl = $('.quantity-select').find('option:selected').data('url');
    const productVariation = await httpClient({
      url: dataUrl,
      method: 'GET',
    });
    if (productVariation?.product) {
      $('body').trigger('product:renderExpressPaymentContainer', {
        product: productVariation?.product,
        paymentMethodsResponse,
      });
    }
    $.spinner().stop();
  });
}

module.exports = {
  init,
  renderExpressPaymentContainer,
  renderApplePayButton,
  renderGooglePayButton,
};
