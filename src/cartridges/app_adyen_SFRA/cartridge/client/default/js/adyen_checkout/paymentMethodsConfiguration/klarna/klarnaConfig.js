class KlarnaConfig {
  constructor(helpers) {
    this.klarnaWidgetEnabled = window.klarnaWidgetEnabled;
    this.helpers = helpers;
    this.document = document;
  }

  onSubmit(state, component) {
    this.helpers.assignPaymentMethodValue();
    this.helpers.paymentFromComponent(state.data, component);
  }

  onAdditionalDetails(state) {
    this.document.querySelector('#additionalDetailsHidden').value =
      JSON.stringify(state.data);
    this.document.querySelector('#showConfirmationForm').submit();
  }

  getConfig() {
    if (this.klarnaWidgetEnabled) {
      return {
        showPayButton: true,
        useKlarnaWidget: true,
        onSubmit: this.onSubmit,
        onAdditionalDetails: this.onAdditionalDetails,
      };
    }
    return null;
  }
}

module.exports = KlarnaConfig;
