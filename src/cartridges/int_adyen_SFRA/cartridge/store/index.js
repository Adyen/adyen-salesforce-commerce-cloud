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

  @observable partialPaymentsOrderObj;

  @observable giftCardComponentListenersAdded;

  @observable addedGiftCards;

  @observable expressPaymentComponents = {};

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

  updateSelectedPayment(method, key, val) {
    this.componentsObj[method][key] = val;
  }

  getExpressPaymentComponents(method) {
    return this.expressPaymentComponents[method];
  }

  setExpressPaymentComponents(method, key, val) {
    if (!this.expressPaymentComponents[method]) {
      this.expressPaymentComponents[method] = {};
    }
    this.expressPaymentComponents[method][key] = val;
  }

}

module.exports = new Store();
