const {
  checkIfExpressMethodsAreReady,
  updateLoadedExpressMethods,
} = require('./commons');
const { AMAZON_PAY } = require('./constants');

async function init(paymentMethodsResponse) {
  try {
    const applicationInfo = paymentMethodsResponse?.applicationInfo;
    const checkout = await AdyenCheckout({
      environment: window.environment,
      clientKey: window.clientKey,
      locale: window.locale,
      analytics: {
        analyticsData: { applicationInfo },
      },
    });

    const amazonPayConfig =
      paymentMethodsResponse?.AdyenPaymentMethods?.paymentMethods.find(
        (pm) => pm.type === AMAZON_PAY,
      )?.configuration;
    if (!amazonPayConfig) {
      updateLoadedExpressMethods(AMAZON_PAY);
      checkIfExpressMethodsAreReady();
      return;
    }

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

module.exports = {
  init,
};
