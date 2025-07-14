const {
  APPLE_PAY,
  GOOGLE_PAY,
  PAY_WITH_GOOGLE,
} = require('../../../../../../config/constants');
const { getExpressPaymentMethods } = require('../../commons/index');
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

function getPaymentMethodConfig(adyenPaymentMethods, paymentMethodType) {
  return adyenPaymentMethods?.paymentMethods.find(
    (pm) => paymentMethodType.indexOf(pm.type) > -1,
  )?.configuration;
}

function renderApplePayButton() {
  $('body').on(`product:render${APPLE_PAY}Button`, async (e, response) => {
    const {
      paymentMethodsResponse: {
        AdyenPaymentMethods,
        applicationInfo,
        adyenTranslations,
      } = {},
      button,
    } = response;
    const applePayConfig = getPaymentMethodConfig(
      AdyenPaymentMethods,
      APPLE_PAY,
    );
    if (!applePayConfig) {
      return;
    }
    const applePay = new ApplePay(
      applePayConfig,
      applicationInfo,
      adyenTranslations,
      true,
    );
    const applePayComponent = await applePay.getComponent();
    applePayComponent.mount(button);
  });
}

function renderGooglePayButton() {
  $('body').on(`product:render${GOOGLE_PAY}Button`, async (e, response) => {
    const {
      paymentMethodsResponse: {
        AdyenPaymentMethods,
        applicationInfo,
        adyenTranslations,
      } = {},
      button,
    } = response;
    const googlePayConfig = getPaymentMethodConfig(AdyenPaymentMethods, [
      GOOGLE_PAY,
      PAY_WITH_GOOGLE,
    ]);
    if (!googlePayConfig) {
      return;
    }
    const googlePay = new GooglePay(
      googlePayConfig,
      applicationInfo,
      adyenTranslations,
      true,
    );
    const googlePayComponent = await googlePay.getComponent();
    googlePayComponent.mount(button);
  });
}

function getExpressPaymentButtons(paymentMethodsResponse, product) {
  const { pdpExpressMethods } = paymentMethodsResponse;
  return pdpExpressMethods.map((pm) => {
    const $container = document.createElement('div');
    $container.setAttribute('id', `${pm}-pdp`);
    $container.setAttribute('class', `expressComponent ${pm}`);
    $container.setAttribute('data-method', `${pm}`);
    $container.setAttribute('data-pid', `${product.id}`);
    $container.setAttribute('style', `padding:0`);
    return $container;
  });
}

function renderExpressPaymentContainer() {
  $('body').on('product:renderExpressPaymentContainer', (e, response) => {
    const { product = {}, paymentMethodsResponse } = response;
    const $expressPaymentButtonsContainer = document.getElementById(
      'express-payment-buttons',
    );
    if (
      product.readyToOrder &&
      product.available &&
      paymentMethodsResponse?.pdpExpressMethods?.length
    ) {
      const expressPaymentButtons = getExpressPaymentButtons(
        paymentMethodsResponse,
        product,
      );
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
  if (window.areExpressPaymentsEnabledOnPdp === 'true') {
    const paymentMethodsResponse = await getExpressPaymentMethods();
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
}

module.exports = {
  init,
  renderExpressPaymentContainer,
  renderApplePayButton,
  renderGooglePayButton,
};
