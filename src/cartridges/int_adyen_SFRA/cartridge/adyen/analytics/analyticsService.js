const UUIDUtils = require('dw/util/UUIDUtils');

const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const constants = require('*/cartridge/adyen/config/constants');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function execute(serviceType, requestObject, checkoutAttemptID = '') {
  const service = AdyenHelper.getService(serviceType);
  if (service === null) {
    throw new Error(`Could not create ${serviceType} service object`);
  }
  const clientKey = AdyenConfigs.getAdyenClientKey();
  let serviceUrl = service.getURL();
  serviceUrl += `/${checkoutAttemptID}?clientKey=${clientKey}`;
  service.setURL(serviceUrl);

  const apiKey = AdyenConfigs.getAdyenApiKey();
  const uuid = UUIDUtils.createUUID();
  service.addHeader('Content-type', 'application/json');
  service.addHeader('charset', 'UTF-8');
  service.addHeader('X-API-KEY', apiKey);
  service.addHeader('Idempotency-Key', uuid);

  const callResult = service.call(JSON.stringify(requestObject));
  AdyenLogs.info_log(`is OK ${JSON.stringify(callResult.isOk())}`);

  if (!callResult.isOk()) {
    throw new Error(
      `${serviceType} service call error code${callResult
        .getError()
        .toString()} Error => ResponseStatus: ${callResult.getStatus()} | ResponseErrorText: ${callResult.getErrorMessage()} | ResponseText: ${callResult.getMsg()}`,
    );
  }

  return { success: true };
}

function createCheckoutAttemptId() {
  try {
    const analyticsResponse = {};
    const requestObject = {
      applicationInfo: AdyenHelper.getApplicationInfo(),
      channel: 'Web',
      platform: 'Web',
    };

    const response = execute(constants.SERVICE.ADYEN_ANALYTICS, requestObject);

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

    return execute(constants.SERVICE.ADYEN_ANALYTICS, requestObject, attemptId);
  } catch (error) {
    AdyenLogs.error_log('submitData for /analytics call failed:', error);
    return { error: true };
  }
}

module.exports = {
  createCheckoutAttemptId,
  submitData,
};
