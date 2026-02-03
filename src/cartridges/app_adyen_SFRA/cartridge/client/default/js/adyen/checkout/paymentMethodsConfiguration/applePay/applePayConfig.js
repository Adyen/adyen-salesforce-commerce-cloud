class ApplePayConfig {
  constructor(helpers) {
    this.showPayButton = true;
    this.buttonColor = 'black';
    this.helpers = helpers;
  }

  // eslint-disable-next-line class-methods-use-this
  onAuthorized = (data, actions) => {
    try {
      actions.resolve();
    } catch (error) {
      actions.reject();
    }
  };

  onSubmit = async (state, component, actions) => {
    $('#dwfrm_billing').trigger('submit');
    try {
      const response = await this.helpers.paymentFromComponent(
        state.data,
        component,
      );
      actions.resolve({
        resultCode: response.resultCode,
      });
    } catch (error) {
      actions.reject();
    }
  };

  getConfig() {
    return {
      showPayButton: this.showPayButton,
      buttonColor: this.buttonColor,
      onAuthorized: this.onAuthorized,
      onSubmit: this.onSubmit,
    };
  }
}

module.exports = ApplePayConfig;
