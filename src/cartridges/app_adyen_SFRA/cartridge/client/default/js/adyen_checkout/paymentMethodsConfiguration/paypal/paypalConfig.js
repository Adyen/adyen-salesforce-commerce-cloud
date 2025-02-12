const helpers = require('../../helpers');
const store = require('../../../../../../store');

class PaypalConfig {
  constructor() {
    this.showPayButton = true;
    this.environment = window.Configuration.environment;
    store.paypalTerminatedEarly = false;
  }

  onSubmit(state, component) {
    helpers.assignPaymentMethodValue();
    document.querySelector('#adyenStateData').value = JSON.stringify(
      store.selectedPayment.stateData,
    );
    helpers.paymentFromComponent(state.data, component);
  }

  onCancel(data, component) {
    store.paypalTerminatedEarly = false;
    helpers.paymentFromComponent(
      {
        cancelTransaction: true,
        merchantReference: document.querySelector('#merchantReference').value,
        orderToken: document.querySelector('#orderToken').value,
      },
      component,
    );
  }

  onError(error, component) {
    store.paypalTerminatedEarly = false;
    if (component) {
      component.setStatus('ready');
    }
    document.querySelector('#showConfirmationForm').submit();
  }

  onAdditionalDetails(state) {
    store.paypalTerminatedEarly = false;
    document.querySelector('#additionalDetailsHidden').value = JSON.stringify(
      state.data,
    );
    document.querySelector('#showConfirmationForm').submit();
  }

  onClick(data, actions) {
    $('#dwfrm_billing').trigger('submit');
    if (store.formErrorsExist) {
      return actions.reject();
    }
    if (store.paypalTerminatedEarly) {
      helpers.paymentFromComponent({
        cancelTransaction: true,
        merchantReference: document.querySelector('#merchantReference').value,
      });
      store.paypalTerminatedEarly = false;
      return actions.resolve();
    }
    store.paypalTerminatedEarly = true;
    return null;
  }

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
