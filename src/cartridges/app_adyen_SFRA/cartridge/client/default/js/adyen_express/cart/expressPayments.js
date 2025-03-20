const {
  checkIfExpressMethodsAreReady,
  getPaymentMethods,
  updateLoadedExpressMethods,
} = require('../../commons');
const { Paypal } = require('../paymentMethods/index');
const { APPLE_PAY, GOOGLE_PAY, PAYPAL } = require('../../constants');

async function renderPayPalButton(paymentMethodsResponse) {
  const { AdyenPaymentMethods, applicationInfo } = paymentMethodsResponse;
  const paypalConfig = AdyenPaymentMethods?.paymentMethods.find(
    (pm) => pm.type === PAYPAL,
  )?.configuration;
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

function renderExpressPaymentButtons() {
  $('body').on('cart:renderExpressPaymentButtons', async (e, response) => {
    const { paymentMethodsResponse } = response;
    const $expressPaymentButtonsContainer =
      document.getElementById('express-container');
    const expressPaymentButtons = getExpressPaymentButtons();
    $expressPaymentButtonsContainer.replaceChildren(...expressPaymentButtons);
    $('#express-container').spinner().start();
    await renderPayPalButton(paymentMethodsResponse);
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
