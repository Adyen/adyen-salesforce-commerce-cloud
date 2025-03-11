const { onBrand, onFieldValid } = require('../../../commons');

class CardConfig {
  constructor(store, helpers) {
    this.hasHolderName = true;
    this.holderNameRequired = true;
    this.enableStoreDetails = window.showStoreDetails;
    this.clickToPayConfiguration = {
      shopperEmail: window.customerEmail,
      merchantDisplayName: window.merchantAccount,
    };
    this.exposeExpiryDate = false;
    this.store = store;
    this.helpers = helpers;
  }

  onChange = (state) => {
    this.store.updateSelectedPayment('scheme', 'isValid', state.isValid);
    this.store.updateSelectedPayment('scheme', 'stateData', state.data);
  };

  onSubmit = () => {
    this.helpers.assignPaymentMethodValue();
    document.querySelector('button[value="submit-payment"]').disabled = false;
    document.querySelector('button[value="submit-payment"]').click();
  };

  getConfig() {
    return {
      hasHolderName: this.hasHolderName,
      holderNameRequired: this.holderNameRequired,
      enableStoreDetails: this.enableStoreDetails,
      clickToPayConfiguration: this.clickToPayConfiguration,
      exposeExpiryDate: this.exposeExpiryDate,
      onChange: this.onChange,
      onSubmit: this.onSubmit,
      onFieldValid,
      onBrand,
    };
  }
}

module.exports = CardConfig;
