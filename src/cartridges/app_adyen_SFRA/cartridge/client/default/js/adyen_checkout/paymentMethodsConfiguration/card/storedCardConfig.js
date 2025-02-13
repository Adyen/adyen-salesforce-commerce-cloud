const CardConfig = require('./cardConfig');

class StoredCardConfig extends CardConfig {
  constructor(store, helpers) {
    super(store, helpers);
    this.holderNameRequired = false;
  }

  getConfig() {
    const baseConfig = super.getConfig();
    return {
      ...baseConfig,
      holderNameRequired: this.holderNameRequired,
    };
  }
}

module.exports = StoredCardConfig;
