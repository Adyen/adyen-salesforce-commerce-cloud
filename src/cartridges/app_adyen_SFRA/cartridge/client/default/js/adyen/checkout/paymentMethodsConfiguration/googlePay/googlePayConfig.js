class GooglePayConfig {
  constructor(helpers) {
    this.environment = window.Configuration?.environment || null;
    this.merchantAccount = window.merchantAccount || null;
    this.merchantId = window.googleMerchantID || null;
    this.showPayButton = true;
    this.buttonColor = 'white';
    this.helpers = helpers;
  }

  onSubmit = (state, component, actions) => {
    if (state.isValid) {
      this.helpers.assignPaymentMethodValue();
      document.querySelector('button[value="submit-payment"]').disabled = false;
      document.querySelector('button[value="submit-payment"]').click();
      actions.resolve({
        resultCode: 'Pending',
      });
    } else {
      actions.reject();
    }
  };

  getConfiguration = () => ({
    gatewayMerchantId: this.merchantAccount,
    merchantId: this.merchantId,
  });

  getConfig() {
    return {
      environment: this.environment,
      onSubmit: this.onSubmit,
      configuration: this.getConfiguration(),
      showPayButton: this.showPayButton,
      buttonColor: this.buttonColor,
    };
  }
}

module.exports = GooglePayConfig;
