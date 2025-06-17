class CashAppConfig {
  constructor(helpers) {
    this.showPayButton = true;
    this.helpers = helpers;
  }

  onSubmit = (state, component) => {
    $('#dwfrm_billing').trigger('submit');
    this.helpers.assignPaymentMethodValue();
    this.helpers.paymentFromComponent(state.data, component);
  };

  getConfig = () => ({
    showPayButton: this.showPayButton,
    onSubmit: this.onSubmit,
  });
}

module.exports = CashAppConfig;
