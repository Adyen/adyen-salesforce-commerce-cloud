class PaypalConfig {
  constructor(store, helpers) {
    this.store = store;
    this.helpers = helpers;
    this.showPayButton = true;
    this.environment = window.Configuration?.environment || null;
    this.store.paypalTerminatedEarly = false;
  }

  onSubmit = async (state, component, actions) => {
    document.querySelector('#adyenStateData').value = JSON.stringify(
      state.data,
    );
    try {
      const response = await this.helpers.paymentFromComponent(
        state.data,
        component,
        { handleComponentChanges: false },
      );
      if (!response.fullResponse?.resultCode) {
        actions.reject();
        return;
      }
      actions.resolve(response.fullResponse);
    } catch (error) {
      actions.reject(error);
    }
  };

  onCancel = (data, component) => {
    this.store.paypalTerminatedEarly = false;
    this.helpers.paymentFromComponent(
      {
        cancelTransaction: true,
        merchantReference: document.querySelector('#merchantReference').value,
        orderToken: document.querySelector('#orderToken').value,
      },
      component,
    );
  };

  handleFailedPayment = async (component) => {
    if (!this.store.paypalTerminatedEarly) {
      return;
    }
    this.store.paypalTerminatedEarly = false;
    await this.helpers
      .paymentFromComponent(
        {
          cancelTransaction: true,
          merchantReference: document.querySelector('#merchantReference').value,
          orderToken: document.querySelector('#orderToken').value,
        },
        component,
      )
      .catch(() => null);
    if (component) {
      component.setStatus('ready');
    }
    document.querySelector('#showConfirmationForm').submit();
  };

  onError = (error, component) => this.handleFailedPayment(component);

  onPaymentFailed = (result, component) => this.handleFailedPayment(component);

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
      onPaymentFailed: this.onPaymentFailed,
      onAdditionalDetails: this.onAdditionalDetails,
      onClick: this.onClick,
    };
  }
}

module.exports = PaypalConfig;
