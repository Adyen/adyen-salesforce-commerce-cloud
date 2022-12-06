async function mountApplePayComponent() {
  const checkout = await AdyenCheckout({
    locale: 'fr-FR',
    environment: 'test',
    clientKey: 'test_HAYFONPGBNHXLDS36KA4GNUHLQP5ZGDR'
  });
  console.log(checkout);

  const appleConfig = {
    showPayButton: true,
    onSubmit: (state, component) => {
      console.log('onSubmit', state);
    },
    onAdditionalDetails: (state) => {
      console.log('onAdditionalDetails', state);
    },
  };

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
