const server = require('server');
const Transaction = require('dw/system/Transaction');
const csrfProtection = require('dw/web/CSRFProtection');
const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const UUIDUtils = require('dw/util/UUIDUtils');
const URLUtils = require('dw/web/URLUtils');
const PaymentMgr = require('dw/order/PaymentMgr');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const constants = require('*/cartridge/adyen/config/constants');
const analyticsConstants = require('*/cartridge/adyen/analytics/constants');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const bmHelper = require('*/cartridge/utils/helper');
const managementApi = require('*/cartridge/scripts/managementApi');

function createConfigurationTimeEvent(
  objectId,
  referenceId,
  eventSource,
  eventType,
  eventCode,
) {
  Transaction.wrap(() => {
    const uuid = UUIDUtils.createUUID();
    const customObj = CustomObjectMgr.createCustomObject(objectId, uuid);
    customObj.custom.referenceId = referenceId;
    customObj.custom.eventSource = eventSource;
    customObj.custom.eventType = eventType;
    customObj.custom.eventCode = eventCode;
    customObj.custom.processingStatus =
      analyticsConstants.processingStatus.NOT_PROCESSED;
    customObj.custom.retryCount = 0;
  });
}

server.get('Start', (_req, res, next) => {
  if (!csrfProtection.validateRequest()) {
    res.redirect(URLUtils.url('CSRF-Fail'));
    return next();
  }
  res.render('adyenSettings/settings');
  return next();
});

server.post('Save', server.middleware.https, (req, res, next) => {
  try {
    const requestBody = JSON.parse(req.body);
    requestBody.settings.forEach((setting) => {
      Transaction.wrap(() => {
        AdyenConfigs.setCustomPreference(setting.key, setting.value);
      });
      createConfigurationTimeEvent(
        analyticsConstants.configurationTimeEventObjectId,
        setting.key,
        analyticsConstants.eventSource.CONFIGURATION_TIME,
        analyticsConstants.eventType.EXPECTED_END,
        analyticsConstants.eventCode.INFO,
      );
    });
    res.json({
      success: true,
    });
  } catch (error) {
    AdyenLogs.error_log(
      'Error while saving settings in BM configuration:',
      error,
    );
    res.json({
      success: false,
    });
  }

  return next();
});

server.post('TestConnection', server.middleware.https, (req, res, next) => {
  createConfigurationTimeEvent(
    analyticsConstants.configurationTimeEventObjectId,
    analyticsConstants.eventReference.TEST_CONNECTION,
    analyticsConstants.eventSource.CONFIGURATION_TIME,
    analyticsConstants.eventType.EXPECTED_END,
    analyticsConstants.eventCode.INFO,
  );
  try {
    const service = AdyenHelper.getService(
      constants.SERVICE.CHECKOUTPAYMENTMETHODS,
    );
    if (!service) {
      throw new Error('Could not do /paymentMethods call');
    }

    const serviceApiVersion = service
      .getURL()
      .replace('[CHECKOUT_API_VERSION]', constants.CHECKOUT_API_VERSION);
    service.setURL(serviceApiVersion);

    if (AdyenConfigs.getAdyenEnvironment() === constants.MODE.LIVE) {
      const livePrefix = AdyenConfigs.getLivePrefix();
      const serviceUrl = service
        .getURL()
        .replace('[YOUR_LIVE_PREFIX]', livePrefix);
      service.setURL(serviceUrl);
    }

    const requestBody = JSON.parse(req.body);

    const { xApiKey, merchantAccount } = requestBody;
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-key', xApiKey);

    const callResult = service.call(JSON.stringify({ merchantAccount }));
    if (!callResult.isOk()) {
      const { message } = JSON.parse(callResult.getErrorMessage());

      res.json({
        success: false,
        message,
        error: true,
      });
      return next();
    }

    res.json({
      success: true,
      error: false,
    });
  } catch (error) {
    AdyenLogs.error_log('Error while testing API credentials:', error);
    res.json({
      error: true,
      message: 'an unknown error has occurred',
      success: false,
    });
  }

  return next();
});

server.get('GetStores', server.middleware.https, (req, res, next) => {
  if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive()) {
    try {
      bmHelper.saveMetadataField('Adyen_StoreId', []);
      const stores = managementApi.fetchAllStores();
      bmHelper.saveMetadataField('Adyen_StoreId', stores);
      res.json({ success: true, stores });
    } catch (error) {
      AdyenLogs.error_log('Error while fetching stores:', error);
      res.json({ success: false });
    }
    return next();
  }
  return {};
});

module.exports = server.exports();
