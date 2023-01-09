async function mountApplePayComponent() {
  const session = await fetch(window.sessionsUrl);
  const sessionData = await session.json();

  const shippingMethods = await fetch(window.shippingMethodsUrl);
  const shippingMethodsData = await shippingMethods.json();
  const environment = 'test';

  const checkout = await AdyenCheckout({
    environment,
    clientKey: window.clientKey,
    locale: window.locale,
    session: sessionData,
    onPaymentCompleted: (result, component) => {
      console.log(result, component);
    },
    // onError: (error, component) => {
    //   console.log(error.name, error.message, error.stack, component);
    // },
  });

  const applePayConfig = checkout.paymentMethodsResponse.paymentMethods.find(
    (pm) => pm.type === 'applepay',
  ).configuration;

  const applePayButtonConfig = {
    showPayButton: true,
    configuration: applePayConfig,
    shippingMethods: shippingMethodsData.shippingMethods.map((sm) => ({
      label: sm.displayName,
      detail: sm.description,
      identifier: sm.ID,
      amount: `${sm.shippingCost.value}`,
    })),
    onShippingMethodSelected: async (resolve, reject, event) => {
      const { shippingMethod } = event;
      //console.log('shipingmethods', shippingMethod);
      const applePayShippingMethodUpdate = {
        newShippingMethods: shippingMethodsData,
        newTotal: {
          amount: shippingMethod.amount,
        },
        newLineItems: [],
      };
      console.log('onShippingMethodSelected', JSON.stringify(applePayShippingMethodUpdate));
      console.log('session', JSON.stringify(sessionData));
      resolve(applePayShippingMethodUpdate);
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
