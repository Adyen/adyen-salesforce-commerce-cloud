class KlarnaConfig {
  constructor(helpers, klarnaWidgetEnabled) {
    this.helpers = helpers;
    this.klarnaWidgetEnabled = klarnaWidgetEnabled;
    this.document = document;
  }

  onSubmit = (state, component) => {
    this.helpers.paymentFromComponent(state.data, component);
  };

  onAdditionalDetails = (state) => {
    this.document.querySelector('#additionalDetailsHidden').value =
      JSON.stringify(state.data);
    this.document.querySelector('#showConfirmationForm').submit();
  };

  onError = (component) => {
    this.helpers.paymentFromComponent(
      {
        cancelTransaction: true,
        merchantReference: document.querySelector('#merchantReference').value,
        orderToken: document.querySelector('#orderToken').value,
      },
      component,
    );
    document.querySelector('#showConfirmationForm').submit();
  };

  getConfig() {
    if (this.klarnaWidgetEnabled) {
      return {
        showPayButton: true,
        useKlarnaWidget: true,
        onSubmit: this.onSubmit,
        onAdditionalDetails: this.onAdditionalDetails,
        onError: this.onError,
      };
    }
    return null;
  }
}

module.exports = KlarnaConfig;
