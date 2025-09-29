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
    this.submitPaymentButtonSelector = 'button[value="submit-payment"]';
    this.cardNumberSelector = '#cardNumber';
    this.cardTypeSelector = '#cardType';
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

  setFastlaneConfiguration(config) {
    const { authResult, configuration } = this.store.fastlane;
    if (authResult?.authenticationState !== 'succeeded' && configuration) {
      config.fastlaneConfiguration = configuration.fastlaneConfiguration;
    }
  }

  onChange = (state) => {
    this.store.updateSelectedPayment('scheme', 'isValid', state.isValid);
    this.store.updateSelectedPayment('scheme', 'stateData', state.data);
  };

  onSubmit = () => {
    const submitPaymentButton = document.querySelector(
      this.submitPaymentButtonSelector,
    );
    submitPaymentButton.disabled = false;
    submitPaymentButton.click();
  };

  onFieldValid = (data) => {
    if (data.endDigits) {
      this.store.endDigits = data.endDigits;
      document.querySelector(this.cardNumberSelector).value =
        this.store.maskedCardNumber;
    }
  };

  onBrand = (brandObject) => {
    document.querySelector(this.cardTypeSelector).value = brandObject.brand;
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
      onFieldValid: this.onFieldValid,
      onBrand: this.onBrand,
    };
    this.setInstallments(defaultConfig);
    this.setFastlaneConfiguration(defaultConfig);
    return defaultConfig;
  }
}

module.exports = CardConfig;
