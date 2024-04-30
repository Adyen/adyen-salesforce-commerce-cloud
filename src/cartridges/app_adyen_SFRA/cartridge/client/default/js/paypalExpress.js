const { getPaymentMethods } = require('./commons');

const PAYPAL = 'paypal';

async function mountPaypalComponent() {
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

    const paypalConfig = paymentMethodsResponse?.paymentMethods.find(
      (pm) => pm.type === PAYPAL,
    )?.configuration;
    if (!paypalConfig) return;

    const paypalButtonConfig = {
      showPayButton: true,
      configuration: paypalConfig,
      returnUrl: window.returnUrl,
      isExpress: true,
    };

    const paypalExpressButton = checkout.create(PAYPAL, paypalButtonConfig);
    paypalExpressButton.mount('#paypal-container');
  } catch (e) {
    //
  }
}

mountPaypalComponent();
