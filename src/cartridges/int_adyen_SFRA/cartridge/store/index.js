const { observable, computed } = require('mobx');

class Store {
  MASKED_CC_PREFIX = '************';

  @observable checkout;

  @observable endDigits;

  @observable selectedMethod;

  @observable componentsObj = {};

  @observable checkoutConfiguration = window.Configuration || {};

  @observable formErrorsExist;

  @observable isValid = false;

  @observable paypalTerminatedEarly = false;

  @observable componentState = {};

  @observable brand;

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
    console.log(this.selectedMethod);
    return (
      this.selectedPayment?.stateData || {
        paymentMethod: {
          type: this.selectedMethod,
          ...(this.brand ? { brand: this.brand } : undefined),
          // type: 'scheme',
          // storedPaymentMethodId: this.selectedMethod,
        },
      }
    );
  }

  updateSelectedPayment(key, val) {
    this.selectedPayment[key] = val;
  }
}

module.exports = new Store();
