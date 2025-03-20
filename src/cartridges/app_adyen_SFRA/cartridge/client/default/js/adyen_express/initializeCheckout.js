async function initializeCheckout(applicationInfo) {
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
