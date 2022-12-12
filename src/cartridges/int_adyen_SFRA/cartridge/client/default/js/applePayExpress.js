const helpers = require('./adyen_checkout/helpers');

async function mountApplePayComponent() {
  const session = await fetch(window.sessionsUrl);
  const sessionData = await session.json();
  console.log(sessionData);

  const shippingMethods = await fetch(window.shippingMethodsUrl);
  const shippingMethodsData = await shippingMethods.json();
  const environment = 'test';

  const checkout = await AdyenCheckout({
    environment,
    clientKey: window.clientKey,
    locale: window.locale,
    session: sessionData,
  });

  const applePayConfig = checkout.paymentMethodsResponse.paymentMethods.find(
    (pm) => pm.type === 'applepay',
  ).configuration;

  const applePayButtonConfig = {
    showPayButton: true,
    configuration: applePayConfig,
    shippingMethods: shippingMethodsData.shippingMethods,
    onShippingMethodSelected: (data) => {
      console.log('onShippingMethodSelected', data);
    },
    // onSubmit: (state, component) => {
    //   console.log('onSubmit', state, component);
    //   helpers.paymentFromComponent(state.data, component, 'applepay');
    // },
  };

  const applePayButton = checkout.create('applepay', applePayButtonConfig);
  const isApplePayButtonAvailable = await applePayButton.isAvailable();
  if (isApplePayButtonAvailable) {
    applePayButton.mount('#applepay-container');
  }
}

mountApplePayComponent();
