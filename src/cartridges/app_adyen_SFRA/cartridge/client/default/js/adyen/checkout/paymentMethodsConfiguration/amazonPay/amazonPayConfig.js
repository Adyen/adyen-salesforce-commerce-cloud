class AmazonPayConfig {
  constructor(store, helpers, adyenPaymentMethods) {
    this.showPayButton = true;
    this.productType = 'PayAndShip';
    this.checkoutMode = 'ProcessOrder';
    this.locale = window.Configuration?.locale || null;
    this.returnUrl = window.returnURL;
    this.store = store;
    this.helpers = helpers;
    this.adyenPaymentMethods = adyenPaymentMethods;
  }

  setAmazonPayConfig(defaultConfig) {
    const amazonpay = this.adyenPaymentMethods?.paymentMethods?.find(
      (paymentMethod) => paymentMethod.type === 'amazonpay',
    );
    if (amazonpay) {
      defaultConfig.configuration = amazonpay.configuration;
      defaultConfig.addressDetails = {
        name: `${document.querySelector('#shippingFirstNamedefault')?.value} ${
          document.querySelector('#shippingLastNamedefault')?.value
        }`,
        addressLine1: document.querySelector('#shippingAddressOnedefault')
          ?.value,
        city: document.querySelector('#shippingAddressCitydefault')?.value,
        stateOrRegion: document.querySelector('#shippingAddressCitydefault')
          ?.value,
        postalCode: document.querySelector('#shippingZipCodedefault')?.value,
        countryCode: document.querySelector('#shippingCountrydefault')?.value,
        phoneNumber: document.querySelector('#shippingPhoneNumberdefault')
          ?.value,
      };
    }
  }

  onClick = (resolve, reject) => {
    $('#dwfrm_billing').trigger('submit');
    if (this.store.formErrorsExist) {
      reject();
    } else {
      resolve();
    }
  };

  getConfig() {
    const defaultConfig = {
      showPayButton: this.showPayButton,
      productType: this.productType,
      checkoutMode: this.checkoutMode,
      locale: this.locale,
      returnUrl: this.returnUrl,
      onClick: this.onClick,
    };
    this.setAmazonPayConfig(defaultConfig);
    return defaultConfig;
  }
}

module.exports = AmazonPayConfig;
