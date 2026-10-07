class CashAppConfig {
  constructor(helpers) {
    this.showPayButton = true;
    this.storePaymentMethod = !!window.showCashAppStoreDetails;
    this.helpers = helpers;
  }

  onSubmit = (state, component) => {
    $('#dwfrm_billing').trigger('submit');
    this.helpers.paymentFromComponent(state.data, component);
  };

  getConfig = () => ({
    showPayButton: this.showPayButton,
    ...(this.storePaymentMethod && { storePaymentMethod: true }),
    onSubmit: this.onSubmit,
  });
}

module.exports = CashAppConfig;
