const helpers = require('../../helpers');

class ApplePayConfig {
  constructor() {
    this.showPayButton = true;
    this.buttonColor = 'black';
  }

  onSubmit(state, component) {
    $('#dwfrm_billing').trigger('submit');
    helpers.assignPaymentMethodValue();
    helpers.paymentFromComponent(state.data, component);
  }

  getConfig() {
    return {
      showPayButton: this.showPayButton,
      buttonColor: this.buttonColor,
      onSubmit: this.onSubmit,
    };
  }
}

module.exports = ApplePayConfig;
