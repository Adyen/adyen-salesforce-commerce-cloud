const { getExpressPaymentMethods } = require('../../commons');
const {
  Paypal,
  ApplePay,
  GooglePay,
  AmazonPay,
} = require('../paymentMethods/index');
const {
  APPLE_PAY,
  GOOGLE_PAY,
  PAYPAL,
  AMAZON_PAY,
  PAY_WITH_GOOGLE,
} = require('../../../../../../config/constants');
const store = require('../../../../../../config/store');

function getPaymentMethodConfig(adyenPaymentMethods, paymentMethodType) {
  return adyenPaymentMethods?.paymentMethods.find(
    (pm) => paymentMethodType.indexOf(pm.type) > -1,
  )?.configuration;
}

function renderPayPalButton() {
  $('body').on(`cart:render${PAYPAL}Button`, async (e, response) => {
    const {
      paymentMethodsResponse: {
        AdyenPaymentMethods,
        applicationInfo,
        adyenTranslations,
      } = {},
      button,
    } = response;
    const paypalConfig = getPaymentMethodConfig(AdyenPaymentMethods, PAYPAL);
    if (!paypalConfig) {
      return;
    }
    const paypal = new Paypal(paypalConfig, applicationInfo, adyenTranslations);
    const paypalComponent = await paypal.getComponent();
    paypalComponent.mount(button);
  });
}

function renderApplePayButton() {
  $('body').on(`cart:render${APPLE_PAY}Button`, async (e, response) => {
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
      false,
    );
    const applePayComponent = await applePay.getComponent();
    applePayComponent.mount(button);
  });
}

function renderAmazonPayButton() {
  $('body').on(`cart:render${AMAZON_PAY}Button`, async (e, response) => {
    const {
      paymentMethodsResponse: {
        AdyenPaymentMethods,
        applicationInfo,
        adyenTranslations,
      } = {},
      button,
    } = response;
    const amazonPayConfig = getPaymentMethodConfig(
      AdyenPaymentMethods,
      AMAZON_PAY,
    );
    if (!amazonPayConfig) {
      return;
    }
    const amazonPay = new AmazonPay(
      amazonPayConfig,
      applicationInfo,
      adyenTranslations,
    );
    const amazonPayComponent = await amazonPay.getComponent();
    amazonPayComponent.mount(button);
  });
}

function renderGooglePayButton() {
  $('body').on(`cart:render${GOOGLE_PAY}Button`, async (e, response) => {
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
      false,
    );
    const googlePayComponent = await googlePay.getComponent();
    googlePayComponent.mount(button);
  });
}

function getExpressPaymentButtons(paymentMethodsResponse) {
  const { cartExpressMethods } = paymentMethodsResponse;
  return cartExpressMethods.map((pm) => {
    const $container = document.createElement('div');
    $container.setAttribute('id', `${pm}-container`);
    $container.setAttribute('class', `expressComponent ${pm}`);
    $container.setAttribute('data-method', `${pm}`);
    $container.setAttribute('style', `padding:0`);
    return $container;
  });
}

function renderExpressPaymentContainer() {
  $('body').on('cart:renderExpressPaymentContainer', async (e, response) => {
    const { paymentMethodsResponse } = response;
    const $expressPaymentButtonsContainer =
      document.getElementById('express-container');
    const expressPaymentButtons = getExpressPaymentButtons(
      paymentMethodsResponse,
    );
    $expressPaymentButtonsContainer.replaceChildren(...expressPaymentButtons);
    $('#express-container').spinner().start();
    expressPaymentButtons.forEach((button) => {
      const expressType = button.getAttribute('data-method');
      $('body').trigger(`cart:render${expressType}Button`, {
        paymentMethodsResponse,
        button,
      });
    });
    $.spinner().stop();
  });
}

async function init() {
  if (window.areCartExpressPaymentsEnabled === 'true') {
    const paymentMethodsResponse = await getExpressPaymentMethods();
    store.paymentMethodsResponse = paymentMethodsResponse;
    $(document).ready(async () => {
      $('body').trigger('cart:renderExpressPaymentContainer', {
        paymentMethodsResponse,
      });
    });
  }
}

module.exports = {
  init,
  renderExpressPaymentContainer,
  renderPayPalButton,
  renderApplePayButton,
  renderGooglePayButton,
  renderAmazonPayButton,
};
