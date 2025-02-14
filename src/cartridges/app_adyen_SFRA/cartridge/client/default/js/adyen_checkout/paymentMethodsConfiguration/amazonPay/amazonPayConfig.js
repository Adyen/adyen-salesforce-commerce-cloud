class AmazonPayConfig {
  constructor(store, helpers) {
    this.showPayButton = true;
    this.productType = 'PayAndShip';
    this.checkoutMode = 'ProcessOrder';
    this.locale = window.Configuration?.locale || null;
    this.returnUrl = window.returnURL;
    this.store = store;
    this.helpers = helpers;
  }

  onClick = (resolve, reject) => {
    $('#dwfrm_billing').trigger('submit');
    if (this.store.formErrorsExist) {
      reject();
    } else {
      this.helpers.assignPaymentMethodValue();
      resolve();
    }
  };

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
