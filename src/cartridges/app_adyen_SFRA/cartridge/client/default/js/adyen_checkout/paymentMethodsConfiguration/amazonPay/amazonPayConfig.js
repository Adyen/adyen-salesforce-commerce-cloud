const helpers = require('../../helpers');
const store = require('../../../../../../store');

class AmazonPayConfig {
  constructor() {
    this.showPayButton = true;
    this.productType = 'PayAndShip';
    this.checkoutMode = 'ProcessOrder';
    this.locale = window.Configuration.locale;
    this.returnUrl = window.returnURL;
  }

  onClick(resolve, reject) {
    $('#dwfrm_billing').trigger('submit');
    if (store.formErrorsExist) {
      reject();
    } else {
      helpers.assignPaymentMethodValue();
      resolve();
    }
  }

  getConfig() {
    return {
      showPayButton: this.showPayButton,
      productType: this.productType,
      checkoutMode: this.checkoutMode,
      locale: this.locale,
      returnUrl: this.returnUrl,
      onClick: this.onClick,
    };
  }
}

module.exports = AmazonPayConfig;
