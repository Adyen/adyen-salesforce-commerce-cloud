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
    this.store.isValid = state.isValid;
    const method = state.data.paymentMethod.storedPaymentMethodId
      ? `storedCard${state.data.paymentMethod.storedPaymentMethodId}`
      : this.store.selectedMethod;
    this.store.updateSelectedPayment(method, 'isValid', this.store.isValid);
    this.store.updateSelectedPayment(method, 'stateData', state.data);
  };

  onSubmit = () => {
    this.helpers.assignPaymentMethodValue();
    document.querySelector('button[value="submit-payment"]').disabled = false;
    document.querySelector('button[value="submit-payment"]').click();
  };

  getConfig = () => ({
    hasHolderName: this.hasHolderName,
    holderNameRequired: this.holderNameRequired,
    enableStoreDetails: this.enableStoreDetails,
    clickToPayConfiguration: this.clickToPayConfiguration,
    exposeExpiryDate: this.exposeExpiryDate,
    onChange: this.onChange,
    onSubmit: this.onSubmit,
    onFieldValid,
    onBrand,
  });
}

module.exports = CardConfig;
