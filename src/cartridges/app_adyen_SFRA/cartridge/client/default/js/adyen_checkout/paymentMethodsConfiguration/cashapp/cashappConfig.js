const helpers = require('../../helpers');

class CashAppConfig {
  constructor() {
    this.showPayButton = true;
  }

  onSubmit(state, component) {
    $('#dwfrm_billing').trigger('submit');
    helpers.assignPaymentMethodValue();
    helpers.paymentFromComponent(state.data, component);
  }

  getConfig() {
    return {
      showPayButton: this.showPayButton,
      onSubmit: this.onSubmit,
    };
  }
}

module.exports = CashAppConfig;
