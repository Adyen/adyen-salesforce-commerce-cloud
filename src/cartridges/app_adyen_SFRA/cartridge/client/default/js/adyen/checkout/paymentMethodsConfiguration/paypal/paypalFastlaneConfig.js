class PayPalFastlaneConfig {
  constructor(store, helpers) {
    this.store = store;
    this.helpers = helpers;
  }

  onSubmit = (state, component) => {
    this.helpers.assignPaymentMethodValue();
    document.querySelector('#adyenStateData').value = JSON.stringify(
      state.data,
    );
    this.helpers.paymentFromComponent(state.data, component);
  };

  getConfig() {
    return {
      showPayButton: true,
      ...this.store?.fastlane?.configuration,
    };
  }
}

module.exports = PayPalFastlaneConfig;
