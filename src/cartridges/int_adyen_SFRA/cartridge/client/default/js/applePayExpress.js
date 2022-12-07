const helpers = require('./adyen_checkout/helpers');

async function mountApplePayComponent() {
  const appleConfig = {
    showPayButton: true,
    configuration: {
      merchantId: '000000000206355',
      merchantName: 'PluginDemo_CommerceCloudAleksandar_TEST',
    },
    onSubmit: (state, component) => {
      console.log('onSubmit', state, component);
      helpers.assignPaymentMethodValue();
      helpers.paymentFromComponent(state.data, component);
    },
    onAdditionalDetails: (state) => {
      console.log('onAdditionalDetails', state);
    },
    onShippingMethodSelected: (shippingMethod) => {
      console.log('onShippingMethodSelected', shippingMethod);
    },
    onShippingContactSelected: (shippingContact) => {
      console.log('onShippingContactSelected', shippingContact);
    },
  };
  const checkout = await AdyenCheckout({
    locale: 'fr-FR',
    environment: 'test',
    clientKey: 'test_HAYFONPGBNHXLDS36KA4GNUHLQP5ZGDR',
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
