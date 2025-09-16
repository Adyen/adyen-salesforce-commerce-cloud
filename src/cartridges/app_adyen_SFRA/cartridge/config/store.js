// eslint-disable-next-line
const { observable, computed, action } = require('mobx');

class Store {
  MASKED_CC_PREFIX = '************';

  @observable checkout;

  @observable endDigits;

  @observable selectedMethod = '';

  @observable componentsObj = {};

  @observable checkoutConfiguration = window.Configuration || {};

  @observable paymentMethodsConfiguration = {};

  @observable formErrorsExist;

  @observable isValid = false;

  @observable paypalTerminatedEarly = false;

  @observable componentState = {};

  @observable brand;

  @observable partialPaymentsOrderObj;

  @observable giftCardComponentListenersAdded;

  @observable addedGiftCards;

  @observable fastlane = {};

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
        paymentMethod: {
          type: this.selectedMethod,
          ...(this.brand ? { brand: this.brand } : undefined),
        },
      }
    );
  }

  @action updateSelectedPayment(method, key, val) {
    if (!this.componentsObj[method]) {
      this.componentsObj[method] = {};
    }
    this.componentsObj[method][key] = val;
  }

  @action clearPaymentMethod() {
    this.componentsObj = {};
    this.selectedMethod = '';
  }
}

module.exports = new Store();
