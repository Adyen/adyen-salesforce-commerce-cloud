async function initializeCheckout(applicationInfo, translations) {
  return window.AdyenWeb.AdyenCheckout({
    environment: window.environment,
    clientKey: window.clientKey,
    locale: window.locale,
    translations,
    countryCode: window.countryCode,
    analytics: {
      analyticsData: { applicationInfo },
    },
  });
}

module.exports = {
  initializeCheckout,
};
