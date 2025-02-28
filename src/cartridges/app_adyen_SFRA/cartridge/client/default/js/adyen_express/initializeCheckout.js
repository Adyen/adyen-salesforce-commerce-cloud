async function initializeCheckout(paymentMethodsResponse) {
  const applicationInfo = paymentMethodsResponse?.applicationInfo;
  return window.AdyenWeb.AdyenCheckout({
    environment: window.environment,
    clientKey: window.clientKey,
    locale: window.locale,
    countryCode: window.countryCode,
    analytics: {
      analyticsData: { applicationInfo },
    },
  });
}

module.exports = {
  initializeCheckout,
};
