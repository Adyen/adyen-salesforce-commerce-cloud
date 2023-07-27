// const helpers = require('./adyen_checkout/helpers');
const { checkIfExpressMethodsAreReady } = require('./commons/index');
const { updateLoadedExpressMethods } = require('./commons');

const PAYPAL = 'paypal';

let checkout;
// let shippingMethodsData;

async function initializeCheckout() {
  const session = await fetch(window.sessionsUrl);
  const sessionData = await session.json();

  // const shippingMethods = await fetch(window.shippingMethodsUrl);
  // shippingMethodsData = await shippingMethods.json();

  checkout = await AdyenCheckout({
    environment: window.environment,
    clientKey: window.clientKey,
    locale: window.locale,
    session: sessionData,
  });
}

initializeCheckout().then(() => {
  const payPalPaymentMethod =
    checkout.paymentMethodsResponse.paymentMethods.find(
      (pm) => pm.type === PAYPAL,
    );

  if (payPalPaymentMethod) {
    const payPalConfig = payPalPaymentMethod.configuration;

    const payPalButtonConfig = {
      showPayButton: true,
      isExpress: true,
      blockPayPalPayLaterButton: true,
      blockPayPalVenmoButton: true,
      configuration: payPalConfig,
      amount: checkout.options.amount,
    };

    const payPalButton = checkout.create(PAYPAL, payPalButtonConfig);
    payPalButton.mount('#paypal-container');
  }

  updateLoadedExpressMethods(PAYPAL);
  checkIfExpressMethodsAreReady();
});
