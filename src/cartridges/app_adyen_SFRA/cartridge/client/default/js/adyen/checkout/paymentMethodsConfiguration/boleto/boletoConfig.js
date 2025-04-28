class BoletoConfig {
  constructor() {
    this.personalDetailsRequired = true;
    this.billingAddressRequired = false;
    this.showEmailAddress = false;
  }

  getConfig() {
    return {
      personalDetailsRequired: this.personalDetailsRequired,
      billingAddressRequired: this.billingAddressRequired,
      showEmailAddress: this.showEmailAddress,
    };
  }
}

module.exports = BoletoConfig;
