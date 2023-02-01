async function mountAmazonPayComponent() {
  /**
   * Makes an ajax call to the controller function GetPaymentMethods
   */
  function getPaymentMethods(paymentMethods) {
    $.ajax({
      url: window.getPaymentMethodsURL,
      type: 'get',
      success(data) {
        paymentMethods(data);
      },
    });
  }
  getPaymentMethods(async (data) => {
    const paymentMethodsResponse = data.AdyenPaymentMethods;

    const checkout = await AdyenCheckout({
      environment: window.environment,
      clientKey: window.clientKey,
      locale: window.locale,
    });

    const amazonPayConfig = paymentMethodsResponse.find(
      (pm) => pm.type === 'amazonpay',
    )?.configuration;
    if (!amazonPayConfig) return;

    const amazonPayButtonConfig = {
      showPayButton: true,
      productType: 'PayAndShip',
      configuration: amazonPayConfig,
      returnUrl: window.returnUrl,
    };

    const amazonPayButton = checkout.create('amazonpay', amazonPayButtonConfig);
    amazonPayButton.mount('#amazonpay-container');
  });
}

mountAmazonPayComponent();
