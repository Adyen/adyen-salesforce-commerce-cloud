class GooglePayConfig {
  constructor(helpers) {
    this.environment = window.Configuration?.environment || null;
    this.merchantAccount = window.merchantAccount || null;
    this.merchantId = window.googleMerchantID || null;
    this.showPayButton = true;
    this.buttonColor = 'white';
    this.helpers = helpers;
  }

  onSubmit = async (state, component, actions) => {
    try {
      this.helpers.assignPaymentMethodValue();
      document.querySelector('#adyenStateData').value = JSON.stringify(
        state.data,
      );
      await this.helpers.paymentFromComponent(state.data, component);
      actions.resolve({
        resultCode: 'Authorised',
      });
    } catch (error) {
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
