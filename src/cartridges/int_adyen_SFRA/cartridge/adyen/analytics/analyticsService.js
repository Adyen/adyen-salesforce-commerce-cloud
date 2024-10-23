const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const constants = require('*/cartridge/adyen/config/constants');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function createCheckoutAttemptId() {
  try {
    const analyticsResponse = {};
    const requestObject = {
      applicationInfo: AdyenHelper.getApplicationInfo(),
      channel: 'Web',
      platform: 'Web',
    };

    const response = AdyenHelper.executeCall(
      constants.SERVICE.ADYEN_ANALYTICS,
      requestObject,
    );

    analyticsResponse.attemptId = response.checkoutAttemptId;

    return analyticsResponse;
  } catch (error) {
    AdyenLogs.error_log(
      'createCheckoutAttemptId for /analytics call failed:',
      error,
    );
    return { error: true };
  }
}

function submitData(requestObject, attemptIdParam = null) {
  try {
    let attemptId = attemptIdParam;

    // If attemptId is not provided as a parameter, generate it
    if (!attemptId) {
      const initialAnalyticsCall = createCheckoutAttemptId();
      attemptId = initialAnalyticsCall.attemptId;
    }

    const response = AdyenHelper.executeCall(
      constants.SERVICE.ADYEN_ANALYTICS,
      requestObject,
      attemptId,
    );

    return response;
  } catch (error) {
    AdyenLogs.error_log('submitData for /analytics call failed:', error);
    return { error: true };
  }
}

module.exports = {
  createCheckoutAttemptId,
  submitData,
};
