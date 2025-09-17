class GooglePayConfig {
  constructor(helpers) {
    this.environment = window.Configuration?.environment || null;
    this.merchantAccount = window.merchantAccount || null;
    this.merchantId = window.googleMerchantID || null;
    this.showPayButton = true;
    this.buttonColor = 'white';
    this.helpers = helpers;
    this.document = document;
  }

  onAdditionalDetails = (state) => {
    this.document.querySelector('#additionalDetailsHidden').value =
      JSON.stringify({
        ...state.data,
        paymentData: {},
      });
    this.document.querySelector('#showConfirmationForm').submit();
  };

  onSubmit = async (state, component, actions) => {
    try {
      this.helpers.assignPaymentMethodValue();
      document.querySelector('#adyenStateData').value = JSON.stringify(
        state.data,
      );
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

  getConfiguration = () => ({
    gatewayMerchantId: this.merchantAccount,
    merchantId: this.merchantId,
  });

  getConfig() {
    return {
      environment: this.environment,
      onSubmit: this.onSubmit,
      onAdditionalDetails: this.onAdditionalDetails,
      configuration: this.getConfiguration(),
      showPayButton: this.showPayButton,
      buttonColor: this.buttonColor,
    };
  }
}

module.exports = GooglePayConfig;
