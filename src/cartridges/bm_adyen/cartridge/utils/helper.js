const Site = require('dw/system/Site');
const Transaction = require('dw/system/Transaction');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');

// Helper function to save to metadata field
function saveMetadataField(field, data) {
  const currentSite = Site.getCurrent();
  Transaction.wrap(() => {
    currentSite.setCustomPreferenceValue(field, JSON.stringify(data));
  });
}

// Helper function to initialize a service
function initializeAdyenService(svc, reqMethod) {
  const service = AdyenHelper.getService(svc, reqMethod);
  const apiKey = AdyenConfigs.getAdyenApiKey();
  const merchantAccount = AdyenConfigs.getAdyenMerchantAccount();

  if (!service || !apiKey || !merchantAccount) {
    throw new Error('Missing request parameters, could not perform the call');
  }

  service.addHeader('Content-type', 'application/json');
  service.addHeader('charset', 'UTF-8');
  service.addHeader('X-API-key', apiKey);

  return service;
}

module.exports = { saveMetadataField, initializeAdyenService };
