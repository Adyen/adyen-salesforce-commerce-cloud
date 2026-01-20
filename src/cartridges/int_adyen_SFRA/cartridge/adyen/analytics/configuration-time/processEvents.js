const analyticsConstants = require('*/cartridge/adyen/analytics/constants');
const {
  clearEvents,
  processEvents,
} = require('*/cartridge/adyen/analytics/analyticsUtils');

function processConfigurationTime() {
  processEvents(analyticsConstants.configurationTimeEventObjectId);
}

function clearConfigurationTime() {
  clearEvents(analyticsConstants.configurationTimeEventObjectId);
}

module.exports = {
  processConfigurationTime,
  clearConfigurationTime,
};
