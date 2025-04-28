const { onBrand, onFieldValid } = require('../../../../commons');

class CardConfig {
  constructor(store, helpers, shopperEmail, amount) {
    this.hasHolderName = true;
    this.holderNameRequired = true;
    this.enableStoreDetails = window.showStoreDetails;
    this.clickToPayConfiguration = {
      shopperEmail,
      merchantDisplayName: window.merchantAccount,
    };
    this.exposeExpiryDate = false;
    this.store = store;
    this.helpers = helpers;
    this.amount = amount;
  }

  setInstallments(config) {
    const installmentLocales = ['pt_BR', 'ja_JP', 'tr_TR', 'es_MX'];
    if (installmentLocales.indexOf(window.Configuration?.locale) < 0) {
      return;
    }
    const installments = JSON.parse(
      window.installments?.replace(/&quot;/g, '"'),
    );
    if (installments?.length && this.amount) {
      const installmentOptions = {};
      installments.forEach((installment) => {
        const [minAmount, numOfInstallments, cards] = installment;
        if (minAmount <= this.amount.value) {
          cards.forEach((cardType) => {
            if (!installmentOptions[cardType]) {
              installmentOptions[cardType] = {
                values: [1],
              };
            }
            if (
              !installmentOptions[cardType].values.includes(numOfInstallments)
            ) {
              installmentOptions[cardType].values.push(numOfInstallments);
              installmentOptions[cardType].values.sort((a, b) => a - b);
            }
          });
        }
      });
      config.installmentOptions = installmentOptions;
      config.showInstallmentAmounts = true;
    }
  }

  onChange = (state) => {
    this.store.updateSelectedPayment('scheme', 'isValid', state.isValid);
    this.store.updateSelectedPayment('scheme', 'stateData', state.data);
  };

  onSubmit = () => {
    this.helpers.assignPaymentMethodValue();
    document.querySelector('button[value="submit-payment"]').disabled = false;
    document.querySelector('button[value="submit-payment"]').click();
  };

  getConfig() {
    const defaultConfig = {
      hasHolderName: this.hasHolderName,
      holderNameRequired: this.holderNameRequired,
      enableStoreDetails: this.enableStoreDetails,
      clickToPayConfiguration: this.clickToPayConfiguration,
      exposeExpiryDate: this.exposeExpiryDate,
      onChange: this.onChange,
      onSubmit: this.onSubmit,
      onFieldValid,
      onBrand,
    };
    this.setInstallments(defaultConfig);
    return defaultConfig;
  }
}

module.exports = CardConfig;
