// eslint-disable-next-line
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
    if (!this.componentsObj[method]) {
      this.componentsObj[method] = {};
    }
    this.componentsObj[method][key] = val;
  }
}

module.exports = new Store();
