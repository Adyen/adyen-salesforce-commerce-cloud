import { action, observable, computed } from "mobx";

class Store {
  MASKED_CC_PREFIX = "************";
  @observable checkout;
  @observable endDigits;
  @observable selectedMethod;
  @observable componentsObj = {};
  @observable checkoutConfiguration = window.Configuration;
  @observable formErrorsExist;
  @observable isValid = false;

  @computed get maskedCardNumber() {
    return `${this.MASKED_CC_PREFIX}${this.endDigits}`;
  }

  createCheckout() {
    this.checkout = new AdyenCheckout(this.checkoutConfiguration);
  }
}

export default new Store();
