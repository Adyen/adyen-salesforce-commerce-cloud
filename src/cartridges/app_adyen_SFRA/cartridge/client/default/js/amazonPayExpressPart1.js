const {
  checkIfExpressMethodsAreReady,
  updateLoadedExpressMethods,
  getPaymentMethods,
} = require('./commons');
const { AMAZON_PAY } = require('./constants');

async function mountAmazonPayComponent() {
  try {
    const data = await getPaymentMethods();
    const paymentMethodsResponse = data?.AdyenPaymentMethods;
    const applicationInfo = data?.applicationInfo;
    const checkout = await AdyenCheckout({
      environment: window.environment,
      clientKey: window.clientKey,
      locale: window.locale,
      analytics: {
        analyticsData: { applicationInfo },
      },
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
      isExpress: true,
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
