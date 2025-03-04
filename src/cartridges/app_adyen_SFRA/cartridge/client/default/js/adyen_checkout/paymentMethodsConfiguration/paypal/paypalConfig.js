class PaypalConfig {
  constructor(store, helpers) {
    this.store = store;
    this.helpers = helpers;
    this.showPayButton = true;
    this.environment = window.Configuration?.environment || null;
    this.store.paypalTerminatedEarly = false;
  }

  onSubmit = (state, component) => {
    this.helpers.assignPaymentMethodValue();
    document.querySelector('#adyenStateData').value = JSON.stringify(
      this.store.selectedPayment.stateData,
    );
    this.helpers.paymentFromComponent(state.data, component);
  };

  onCancel = async (data, component) => {
    this.store.paypalTerminatedEarly = false;
    await this.helpers.paymentFromComponent(
      {
        cancelTransaction: true,
        merchantReference: document.querySelector('#merchantReference').value,
        orderToken: document.querySelector('#orderToken').value,
      },
      component,
    );
  };

  onError = async (error, component) => {
    await this.onCancel(component);
    component.setStatus('ready');
    document.querySelector('#showConfirmationForm').submit();
  };

  onAdditionalDetails = (state) => {
    this.store.paypalTerminatedEarly = false;
    document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
      state.data,
    );
    document.querySelector('#showConfirmationForm').submit();
  };

  onClick = (data, actions) => {
    $('#dwfrm_billing').trigger('submit');
    if (this.store.formErrorsExist) {
      return actions.reject();
    }
    if (this.store.paypalTerminatedEarly) {
      this.helpers.paymentFromComponent({
        cancelTransaction: true,
        merchantReference: document.querySelector('#merchantReference').value,
      });
      this.store.paypalTerminatedEarly = false;
      return actions.resolve();
    }
    this.store.paypalTerminatedEarly = true;
    return null;
  };

  getConfig() {
    return {
      showPayButton: this.showPayButton,
      environment: this.environment,
      onSubmit: this.onSubmit,
      onCancel: this.onCancel,
      onError: this.onError,
      onAdditionalDetails: this.onAdditionalDetails,
      onClick: this.onClick,
    };
  }
}

module.exports = PaypalConfig;
