class GooglePayConfig {
  constructor(helpers) {
    this.environment = window.Configuration.environment;
    this.merchantAccount = window.merchantAccount;
    this.showPayButton = true;
    this.buttonColor = 'white';
    this.helpers = helpers;
  }

  onSubmit = () => {
    this.helpers.assignPaymentMethodValue();
    document.querySelector('button[value="submit-payment"]').disabled = false;
    document.querySelector('button[value="submit-payment"]').click();
  };

  getConfiguration = () => ({
    gatewayMerchantId: this.merchantAccount,
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
