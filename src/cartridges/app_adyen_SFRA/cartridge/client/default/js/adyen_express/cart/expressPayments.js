const { getPaymentMethods } = require('../../commons');
const { Paypal, ApplePay, GooglePay } = require('../paymentMethods/index');
const { APPLE_PAY, GOOGLE_PAY, PAYPAL } = require('../../constants');

function getPaymentMethodConfig(adyenPaymentMethods, paymentMethodType) {
  return adyenPaymentMethods?.paymentMethods.find(
    (pm) => pm.type === paymentMethodType,
  )?.configuration;
}

function renderPayPalButton() {
  $('body').on(`cart:render${PAYPAL}Button`, async (e, response) => {
    const {
      paymentMethodsResponse: { AdyenPaymentMethods, applicationInfo } = {},
      button,
    } = response;
    const paypalConfig = getPaymentMethodConfig(AdyenPaymentMethods, PAYPAL);
    if (!paypalConfig) {
      return;
    }
    const paypal = new Paypal(paypalConfig, applicationInfo);
    const paypalComponent = await paypal.getComponent();
    paypalComponent.mount(button);
  });
}

function renderApplePayButton() {
  $('body').on(`cart:render${APPLE_PAY}Button`, async (e, response) => {
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
    const applePay = new ApplePay(applePayConfig, applicationInfo);
    const applePayComponent = await applePay.getComponent();
    applePayComponent.mount(button);
  });
}

function renderGooglePayButton() {
  $('body').on(`cart:render${GOOGLE_PAY}Button`, async (e, response) => {
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
    const googlePay = new GooglePay(googlePayConfig, applicationInfo);
    const googlePayComponent = await googlePay.getComponent();
    googlePayComponent.mount(button);
  });
}

function getExpressPaymentButtons() {
  const expressMethodsConfig = {
    [APPLE_PAY]: window.isApplePayExpressEnabled === 'true',
    [GOOGLE_PAY]: window.isGooglePayExpressEnabled === 'true',
    [PAYPAL]: window.isPayPalExpressEnabled === 'true',
  };
  const enabledExpressPaymentButtons = [];
  Object.keys(expressMethodsConfig).forEach((key) => {
    if (expressMethodsConfig[key]) {
      const $container = document.createElement('div');
      $container.setAttribute('id', `${key}-container`);
      $container.setAttribute('class', `expressComponent ${key}`);
      $container.setAttribute('data-method', `${key}`);
      $container.setAttribute('style', `padding:0`);
      enabledExpressPaymentButtons.push($container);
    }
  });
  return enabledExpressPaymentButtons;
}

function renderExpressPaymentContainer() {
  $('body').on('cart:renderExpressPaymentContainer', async (e, response) => {
    const { paymentMethodsResponse } = response;
    const $expressPaymentButtonsContainer =
      document.getElementById('express-container');
    const expressPaymentButtons = getExpressPaymentButtons();
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
  const paymentMethodsResponse = await getPaymentMethods();
  $(document).ready(async () => {
    $('body').trigger('cart:renderExpressPaymentContainer', {
      paymentMethodsResponse,
    });
  });
}
module.exports = {
  init,
  renderExpressPaymentContainer,
  renderPayPalButton,
  renderApplePayButton,
  renderGooglePayButton,
};
