const helpers = require('../../helpers');

class UpiConfig {
  constructor() {
    this.showPayButton = true;
  }

  onSubmit(state, component) {
    $('#dwfrm_billing').trigger('submit');
    helpers.assignPaymentMethodValue();
    helpers.paymentFromComponent(state.data, component);
  }

  onAdditionalDetails(state) {
    document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
      state.data,
    );
    document.querySelector('#showConfirmationForm').submit();
  }

  onError(component) {
    if (component) {
      component.setStatus('ready');
    }
    document.querySelector('#showConfirmationForm').submit();
  }

  getConfig() {
    return {
      showPayButton: this.showPayButton,
      onSubmit: this.onSubmit,
      onAdditionalDetails: this.onAdditionalDetails,
      onError: this.onError,
    };
  }
}

module.exports = UpiConfig;
