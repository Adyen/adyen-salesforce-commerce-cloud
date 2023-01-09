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
      const matchingShippingMethod = shippingMethodsData.shippingMethods.find(
        (sm) => sm.ID === shippingMethod.identifier,
      );
      const response = await fetch(
        window.calculateAmountUrl +
          '?' +
          new URLSearchParams({
            shipmentUUID: matchingShippingMethod.shipmentUUID,
            methodID: matchingShippingMethod.ID,
          }),
        {
          method: 'POST',
        },
      );
      const newAmountResponse = await response.json();

      const applePayShippingMethodUpdate = {
        newTotal: {
          type: 'final',
          label: 'new total',
          amount: newAmountResponse.totals.grandTotal.slice(1),
        },
      };
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
