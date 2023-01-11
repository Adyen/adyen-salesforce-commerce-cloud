async function mountAmazonPayComponent() {
  const session = await fetch(window.sessionsUrl);
  const sessionData = await session.json();

  const shippingMethods = await fetch(window.shippingMethodsUrl);
  const shippingMethodsData = await shippingMethods.json();
  const environment = 'test';

    const x = {
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
                };
                console.log(JSON.stringify(x));

  const checkout = await AdyenCheckout(x);

  const amazonPayConfig = checkout.paymentMethodsResponse.paymentMethods.find(
    (pm) => pm.type === 'amazonpay',
  ).configuration;

    console.log('amazonPayConfig ' + JSON.stringify(amazonPayConfig));

  const amazonPayButtonConfig = {
    showPayButton: true,
    productType: 'PayAndShip',
//    checkoutMode: 'ProcessOrder',
    configuration: amazonPayConfig,
    returnUrl: window.returnUrl,
    shippingMethods: shippingMethodsData.shippingMethods,
    // onSubmit: (state, component) => {
    //   console.log('onSubmit', state, component);
    //   helpers.paymentFromComponent(state.data, component, 'amazonpay');
    // },
  };

  console.log('amazonPayButtonConfig ' + JSON.stringify(amazonPayButtonConfig));

  const amazonPayButton = checkout.create('amazonpay', amazonPayButtonConfig);
  amazonPayButton.mount('#amazonpay-container');
}

mountAmazonPayComponent();
