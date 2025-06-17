const store = require('../../../../../../../config/store');
const { AMAZON_PAY } = require('../../../../../../../config/constants');
const { initializeCheckout } = require('../../initializeCheckout');

class AmazonPay {
  constructor(config, applicationInfo, adyenTranslations) {
    const { returnUrl } = window;
    this.store = store;
    this.showPayButton = true;
    this.isExpress = true;
    this.returnUrl = returnUrl;
    this.applicationInfo = applicationInfo;
    this.translations = adyenTranslations;
    this.config = config;
  }

  getConfig() {
    return {
      configuration: this.config,
      showPayButton: this.showPayButton,
      isExpress: this.isExpress,
      returnUrl: this.returnUrl,
      productType: 'PayAndShip',
    };
  }

  async getComponent() {
    const checkout = await initializeCheckout(
      this.applicationInfo,
      this.translations,
    );
    const amazonPayConfig = this.getConfig();
    return window.AdyenWeb.createComponent(
      AMAZON_PAY,
      checkout,
      amazonPayConfig,
    );
  }
}

module.exports = AmazonPay;
