class ApplePayConfig {
  constructor(helpers) {
    this.showPayButton = true;
    this.buttonColor = 'black';
    this.helpers = helpers;
  }

  onSubmit = (state, component) => {
    $('#dwfrm_billing').trigger('submit');
    this.helpers.paymentFromComponent(state.data, component);
  };

  getConfig() {
    return {
      showPayButton: this.showPayButton,
      buttonColor: this.buttonColor,
      onSubmit: this.onSubmit,
    };
  }
}

module.exports = ApplePayConfig;
