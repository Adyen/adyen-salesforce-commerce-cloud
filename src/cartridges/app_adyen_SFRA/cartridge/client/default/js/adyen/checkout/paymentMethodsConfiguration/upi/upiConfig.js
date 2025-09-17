class UpiConfig {
  constructor(helpers) {
    this.showPayButton = true;
    this.helpers = helpers;
    this.document = document;
  }

  onSubmit = (state, component) => {
    $('#dwfrm_billing').trigger('submit');
    this.helpers.paymentFromComponent(state.data, component);
  };

  onAdditionalDetails = (state) => {
    this.document.querySelector('#additionalDetailsHidden').value =
      JSON.stringify(state.data);
    this.document.querySelector('#showConfirmationForm').submit();
  };

  onError = (component) => {
    if (component) {
      component.setStatus('ready');
    }
    this.document.querySelector('#showConfirmationForm').submit();
  };

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
