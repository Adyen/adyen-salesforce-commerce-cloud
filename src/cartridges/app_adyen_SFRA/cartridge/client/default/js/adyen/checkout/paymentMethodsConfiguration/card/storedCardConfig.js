const CardConfig = require('./cardConfig');

class StoredCardConfig extends CardConfig {
  constructor(store, helpers) {
    super(store, helpers);
    this.holderNameRequired = false;
  }

  onChange = (state) => {
    this.store.isValid = state.isValid;
    const method = `storedCard${state.data.paymentMethod.storedPaymentMethodId}`;
    this.store.updateSelectedPayment(method, 'isValid', this.store.isValid);
    this.store.updateSelectedPayment(method, 'stateData', state.data);
  };

  getConfig() {
    const baseConfig = super.getConfig();
    return {
      ...baseConfig,
      holderNameRequired: this.holderNameRequired,
      onChange: this.onChange,
    };
  }
}

module.exports = StoredCardConfig;
