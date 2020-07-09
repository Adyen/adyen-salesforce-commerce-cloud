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

  @computed get maskedCardNumber() {
    return `${this.MASKED_CC_PREFIX}${this.endDigits}`;
  }

  @computed get selectedPayment() {
    return this.componentsObj[this.selectedMethod];
  }

  @computed get selectedPaymentIsValid() {
    return !!this.selectedPayment?.isValid;
  }

  updateSelectedPayment(key, val) {
    this.selectedPayment[key] = val;
  }
}

export default new Store();
