const {
  checkIfExpressMethodsAreReady,
  updateLoadedExpressMethods,
  getPaymentMethods,
} = require('./commons');

const AMAZON_PAY = 'amazonpay';

async function mountAmazonPayComponent() {
  try {
    const data = await getPaymentMethods();
    const paymentMethodsResponse = data.AdyenPaymentMethods;

    const checkout = await AdyenCheckout({
      environment: window.environment,
      clientKey: window.clientKey,
      locale: window.locale,
    });

    const amazonPayConfig = paymentMethodsResponse?.paymentMethods.find(
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
  } catch (e) {
    //
  }
}

mountAmazonPayComponent();
