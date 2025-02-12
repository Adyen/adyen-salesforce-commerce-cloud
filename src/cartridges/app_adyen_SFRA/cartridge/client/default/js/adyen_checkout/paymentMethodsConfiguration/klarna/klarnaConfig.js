const helpers = require('../../helpers');

class KlarnaConfig {
  constructor() {
    this.klarnaWidgetEnabled = window.klarnaWidgetEnabled;
  }

  onSubmit(state, component) {
    helpers.assignPaymentMethodValue();
    helpers.paymentFromComponent(state.data, component);
  }

  onAdditionalDetails(state) {
    document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
      state.data,
    );
    document.querySelector('#showConfirmationForm').submit();
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
