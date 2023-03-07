const {
  checkIfExpressMethodsAreReady,
  updateLoadedExpressMethods,
} = require('./commons');

const AMAZON_PAY = 'amazonpay';

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
      error() {
        updateLoadedExpressMethods(AMAZON_PAY);
        checkIfExpressMethodsAreReady();
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
      (pm) => pm.type === AMAZON_PAY,
    )?.configuration;
    if (!amazonPayConfig) return;

    const amazonPayButtonConfig = {
      showPayButton: true,
      productType: 'PayAndShip',
      configuration: amazonPayConfig,
      returnUrl: window.returnUrl,
    };

    const amazonPayButton = checkout.create(AMAZON_PAY, amazonPayButtonConfig);
    amazonPayButton.mount('#amazonpay-container');
    updateLoadedExpressMethods(AMAZON_PAY);
    checkIfExpressMethodsAreReady();
  });
}

mountAmazonPayComponent();
