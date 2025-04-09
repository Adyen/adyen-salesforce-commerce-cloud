const {
  checkIfExpressMethodsAreReady,
  getPaymentMethods,
  updateLoadedExpressMethods,
} = require('../../commons');
const { Paypal, ApplePay, AmazonPay } = require('../paymentMethods/index');
const {
  APPLE_PAY,
  GOOGLE_PAY,
  PAYPAL,
  AMAZON_PAY,
} = require('../../constants');

function getPaymentMethodConfig(adyenPaymentMethods, paymentMethodType) {
  return adyenPaymentMethods?.paymentMethods.find(
    (pm) => pm.type === paymentMethodType,
  )?.configuration;
}

async function renderPayPalButton(paymentMethodsResponse) {
  const { AdyenPaymentMethods, applicationInfo } = paymentMethodsResponse;
  const paypalConfig = getPaymentMethodConfig(AdyenPaymentMethods, PAYPAL);
  if (!paypalConfig) {
    updateLoadedExpressMethods(PAYPAL);
    checkIfExpressMethodsAreReady();
    return;
  }
  const paypal = new Paypal(paypalConfig, applicationInfo);
  const paypalComponent = await paypal.getComponent();
  paypalComponent.mount('.paypal');
  updateLoadedExpressMethods(PAYPAL);
  checkIfExpressMethodsAreReady();
}

async function renderApplePayButton(paymentMethodsResponse) {
  const { AdyenPaymentMethods, applicationInfo } = paymentMethodsResponse;
  const applePayConfig = getPaymentMethodConfig(AdyenPaymentMethods, APPLE_PAY);
  if (!applePayConfig) {
    updateLoadedExpressMethods(APPLE_PAY);
    checkIfExpressMethodsAreReady();
    return;
  }
  const applePay = new ApplePay(applePayConfig, applicationInfo);
  const applePayComponent = await applePay.getComponent();
  applePayComponent.mount('.applepay');
  updateLoadedExpressMethods(APPLE_PAY);
  checkIfExpressMethodsAreReady();
}

async function renderAmazonPayButton(paymentMethodsResponse) {
  const { AdyenPaymentMethods, applicationInfo } = paymentMethodsResponse;
  const amazonPayConfig = getPaymentMethodConfig(
    AdyenPaymentMethods,
    AMAZON_PAY,
  );
  if (!amazonPayConfig) {
    updateLoadedExpressMethods(AMAZON_PAY);
    checkIfExpressMethodsAreReady();
    return;
  }
  const amazonPay = new AmazonPay(amazonPayConfig, applicationInfo);
  const amazonPayComponent = await amazonPay.getComponent();
  amazonPayComponent.mount('#amazonpay-container');
  updateLoadedExpressMethods(AMAZON_PAY);
  checkIfExpressMethodsAreReady();
}

function getExpressPaymentButtons() {
  const expressMethodsConfig = {
    [APPLE_PAY]: window.isApplePayExpressEnabled === 'true',
    [GOOGLE_PAY]: window.isGooglePayExpressEnabled === 'true',
    [PAYPAL]: window.isPayPalExpressEnabled === 'true',
    [AMAZON_PAY]: window.isAmazonPayExpressEnabled === 'true',
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

function renderExpressPaymentButtons() {
  $('body').on('cart:renderExpressPaymentButtons', async (e, response) => {
    const { paymentMethodsResponse } = response;
    const $expressPaymentButtonsContainer =
      document.getElementById('express-container');
    const expressPaymentButtons = getExpressPaymentButtons();
    $expressPaymentButtonsContainer.replaceChildren(...expressPaymentButtons);
    $('#express-container').spinner().start();
    await renderPayPalButton(paymentMethodsResponse);
    await renderApplePayButton(paymentMethodsResponse);
    await renderAmazonPayButton(paymentMethodsResponse);
    $.spinner().stop();
  });
}

async function init() {
  const paymentMethodsResponse = await getPaymentMethods();
  $(document).ready(async () => {
    $('body').trigger('cart:renderExpressPaymentButtons', {
      paymentMethodsResponse,
    });
  });
}
module.exports = {
  init,
  renderExpressPaymentButtons,
};
