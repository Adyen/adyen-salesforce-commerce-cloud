const helpers = require('../../helpers');
const store = require('../../../../../../store');
const { onBrand, onFieldValid } = require('../../../commons');

class CardConfig {
  constructor() {
    this.hasHolderName = true;
    this.holderNameRequired = true;
    this.enableStoreDetails = window.showStoreDetails;
    this.clickToPayConfiguration = {
      shopperEmail: window.customerEmail,
      merchantDisplayName: window.merchantAccount,
    };
    this.exposeExpiryDate = false;
  }

  onChange(state) {
    store.isValid = state.isValid;
    const method = state.data.paymentMethod.storedPaymentMethodId
      ? `storedCard${state.data.paymentMethod.storedPaymentMethodId}`
      : store.selectedMethod;
    store.updateSelectedPayment(method, 'isValid', store.isValid);
    store.updateSelectedPayment(method, 'stateData', state.data);
  }

  onSubmit() {
    helpers.assignPaymentMethodValue();
    document.querySelector('button[value="submit-payment"]').disabled = false;
    document.querySelector('button[value="submit-payment"]').click();
  }

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
