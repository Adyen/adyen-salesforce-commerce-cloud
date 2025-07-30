const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const Transaction = require('dw/system/Transaction');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const { processingStatus } = require('./constants');
const {
  createAnalyticsRequest,
  sendAnalyticsEvents,
} = require('./job/analyticsJob');

function processEvents(customObjectId) {
  const query = 'custom.processingStatus = {0}';
  const queryArgs = [processingStatus.NOT_PROCESSED];
  let customObjectIterator = null;
  try {
    customObjectIterator = CustomObjectMgr.queryCustomObjects(
      customObjectId,
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

function clearEvents(customObjectId) {
  let customObjectIterator = null;
  try {
    const query =
      'custom.processingStatus = {0} OR custom.processingStatus = {1}';
    const queryArgs = [processingStatus.SKIPPED, processingStatus.PROCESSED];
    customObjectIterator = CustomObjectMgr.queryCustomObjects(
      customObjectId,
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
  processEvents,
  clearEvents,
};
