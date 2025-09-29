const analyticsConstants = require('*/cartridge/adyen/analytics/constants');
const {
  processEvents,
  clearEvents,
} = require('*/cartridge/adyen/analytics/analyticsUtils');

function processAnalytics() {
  processEvents(analyticsConstants.analyticsEventObjectId);
}

function clearAnalytics() {
  clearEvents(analyticsConstants.analyticsEventObjectId);
}

module.exports = {
  processAnalytics,
  clearAnalytics,
};
