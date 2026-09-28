class CashAppConfig {
  constructor(helpers) {
    this.showPayButton = true;
    // must be set before authorization so Cash App also grants the on-file
    // action, which is what returns onFileGrantId and cashtag
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
