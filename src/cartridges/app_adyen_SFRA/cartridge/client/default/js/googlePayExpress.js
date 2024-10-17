const {
  checkIfExpressMethodsAreReady,
  updateLoadedExpressMethods,
  getPaymentMethods,
} = require('./commons');
const { GOOGLE_PAY } = require('./constants');

let checkout;
let paymentMethodsResponse;

async function initializeCheckout() {
  const paymentMethods = await getPaymentMethods();
  paymentMethodsResponse = await paymentMethods.json();
  const applicationInfo = paymentMethodsResponse?.applicationInfo;
  checkout = await AdyenCheckout({
    environment: window.environment,
    clientKey: window.clientKey,
    locale: window.locale,
    analytics: {
      analyticsData: { applicationInfo },
    },
  });
}

async function init() {
  initializeCheckout()
    .then(async () => {
      const googlePayPaymentMethod =
        paymentMethodsResponse?.AdyenPaymentMethods?.paymentMethods.find(
          (pm) => pm.type === GOOGLE_PAY,
        );
      if (!googlePayPaymentMethod) {
        updateLoadedExpressMethods(GOOGLE_PAY);
        checkIfExpressMethodsAreReady();
        return;
      }

      const googlePayConfig = googlePayPaymentMethod.configuration;
      const googlePayButtonConfig = {
        showPayButton: true,
        buttonType: 'buy',
        configuration: googlePayConfig,
        returnUrl: window.returnUrl,
        isExpress: true,
      };

      const googlePayButton = checkout.create(
        GOOGLE_PAY,
        googlePayButtonConfig,
      );
      googlePayButton.mount('#googlepay-container');
      updateLoadedExpressMethods(GOOGLE_PAY);
      checkIfExpressMethodsAreReady();
    })
    .catch(() => {
      updateLoadedExpressMethods(GOOGLE_PAY);
      checkIfExpressMethodsAreReady();
    });
}

init();
