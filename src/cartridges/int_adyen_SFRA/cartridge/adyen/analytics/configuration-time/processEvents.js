const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const Transaction = require('dw/system/Transaction');
const analyticsConstants = require('*/cartridge/adyen/analytics/constants');
const AdyenLogs = require('../../logs/adyenCustomLogs');
const {
  createAnalyticsRequest,
  sendAnalyticsEvents,
} = require('../job/analyticsJob');
const { processingStatus } = require('../constants');

function processConfigurationTime() {
  const query = 'custom.processingStatus = {0}';
  const queryArgs = [processingStatus.NOT_PROCESSED];
  let customObjectIterator = null;
  try {
    // Query the custom objects by processing status
    customObjectIterator = CustomObjectMgr.queryCustomObjects(
      analyticsConstants.configurationTimeEventObjectId,
      query,
      null,
      queryArgs,
    );
    const analyticsRequest = createAnalyticsRequest(customObjectIterator);
    sendAnalyticsEvents(analyticsRequest);
  } catch (e) {
    AdyenLogs.error_log('Error querying custom objects:', e);
    throw e;
  } finally {
    if (customObjectIterator) {
      customObjectIterator.close();
    }
  }
}

function clearConfigurationTime() {
  let customObjectIterator = null;
  try {
    const query =
      'custom.processingStatus = {0} OR custom.processingStatus = {1}';
    const queryArgs = [
      analyticsConstants.processingStatus.SKIPPED,
      analyticsConstants.processingStatus.PROCESSED,
    ];
    customObjectIterator = CustomObjectMgr.queryCustomObjects(
      analyticsConstants.configurationTimeEventObjectId,
      query,
      null,
      queryArgs,
    );
    while (customObjectIterator.hasNext()) {
      const customObject = customObjectIterator.next();
      Transaction.wrap(() => {
        CustomObjectMgr.remove(customObject);
      });
    }
  } catch (e) {
    AdyenLogs.error_log('Error deleting custom object:', e);
  } finally {
    if (customObjectIterator) {
      customObjectIterator.close();
    }
  }
}

module.exports = {
  processConfigurationTime,
  clearConfigurationTime,
};
