import { observable, computed } from "mobx";

class Store {
  MASKED_CC_PREFIX = "************";

  @observable checkout;

  @observable endDigits;

  @observable selectedMethod;

  @observable componentsObj = {};

  @observable checkoutConfiguration = window.Configuration || {};

  @observable formErrorsExist;

  @observable isValid = false;

  @observable componentState = {};

  @computed get maskedCardNumber() {
    return `${this.MASKED_CC_PREFIX}${this.endDigits}`;
  }

  @computed get selectedPayment() {
    return this.componentsObj[this.selectedMethod];
  }

  @computed get selectedPaymentIsValid() {
    return !!this.selectedPayment?.isValid;
  }

  @computed get stateData() {
    return (
      this.selectedPayment?.stateData || {
        paymentMethod: { type: this.selectedMethod },
      }
    );
  }

  updateSelectedPayment(key, val) {
    this.selectedPayment[key] = val;
  }
}

export default new Store();
