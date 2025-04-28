const CardConfig = require('../card/cardConfig');

class BcmcConfig extends CardConfig {
  onChange = (state) => {
    this.store.updateSelectedPayment('bcmc', 'isValid', state.isValid);
    this.store.updateSelectedPayment('bcmc', 'stateData', state.data);
  };

  getConfig() {
    const baseConfig = super.getConfig();
    return {
      ...baseConfig,
      onChange: this.onChange,
    };
  }
}

module.exports = BcmcConfig;
