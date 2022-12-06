async function mountApplePayComponent() {
  const appleConfig = {
    showPayButton: true,
    onSubmit: (state, component) => {
      console.log('onSubmit', state);
    },
    onAdditionalDetails: (state) => {
      console.log('onAdditionalDetails', state);
    },
  };
  const checkout = await AdyenCheckout({
    locale: 'fr-FR',
    environment: 'test',
    clientKey: '',
    paymentMethodsConfiguration: {
      applepay: appleConfig,
    },
  });
  console.log(checkout);

  const applePayComponent = checkout.create('applepay', appleConfig);
  applePayComponent
    .isAvailable()
    .then(() => {
      applePayComponent.mount('#applepay-container');
    })
    .catch((e) => {
      console.log('error', e);
    });
}

mountApplePayComponent();
