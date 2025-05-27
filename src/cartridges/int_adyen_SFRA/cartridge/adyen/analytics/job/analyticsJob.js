const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const Transaction = require('dw/system/Transaction');
const analyticsConstants = require('*/cartridge/adyen/analytics/constants');
const AnalyticsService = require('../analyticsService');
const AdyenLogs = require('../../logs/adyenCustomLogs');

const defaultProperties = {
  channel: 'Web',
  platform: 'Web',
  [analyticsConstants.eventCode.INFO]: [],
  [analyticsConstants.eventCode.LOG]: [],
  [analyticsConstants.eventCode.ERROR]: [],
  customObjects: [],
};

const eventCodeList = {
  [analyticsConstants.eventCode.INFO]: {
    name: analyticsConstants.eventCode.INFO,
    limit: 50,
  },
  [analyticsConstants.eventCode.ERROR]: {
    name: analyticsConstants.eventCode.ERROR,
    limit: 5,
  },
  [analyticsConstants.eventCode.LOG]: {
    name: analyticsConstants.eventCode.LOG,
    limit: 10,
  },
};

function isValidRequestObject(requestObjectList) {
  const lastRequestObject = requestObjectList[requestObjectList.length - 1];
  return !Object.keys(eventCodeList).some((key) => {
    const eventCode = eventCodeList[key];
    return lastRequestObject[eventCode.name].length >= eventCode.limit;
  });
}

function updateCounter(customObject) {
  try {
    Transaction.wrap(() => {
      customObject.custom.retryCount += 1;
    });
  } catch (e) {
    AdyenLogs.error_log('Error updating counter:', e);
  }
}

function updateProcessingStatus(customObject, status) {
  try {
    Transaction.wrap(() => {
      customObject.custom.processingStatus = status;
    });
  } catch (e) {
    AdyenLogs.error_log('Error updating processingStatus:', e);
  }
}

function getEventObject(event, creationDate) {
  const eventObject = {
    timestamp: new Date(creationDate).getTime().toString(),
    type: analyticsConstants.eventType[event.eventType],
    target: event.referenceId,
    id: event.eventId,
    component: event.eventSource,
  };
  if (event.eventCode === analyticsConstants.eventCode.ERROR) {
    delete eventObject.type;
    delete eventObject.target;
    eventObject.errorType = analyticsConstants.errorType;
  }
  return eventObject;
}

function createAnalyticsRequest(customObjectIterator) {
  let counter = 0;
  const requestObjectList = [];
  requestObjectList.push({ ...defaultProperties });
  while (customObjectIterator.hasNext()) {
    if (counter >= analyticsConstants.EVENT_LIMIT) {
      break;
    }
    const customObject = customObjectIterator.next();
    if (isValidRequestObject(requestObjectList)) {
      requestObjectList.push({ ...defaultProperties });
    }
    const requestObject = requestObjectList[requestObjectList.length - 1];
    const { creationDate, custom: event } = customObject;
    const eventObject = getEventObject(event, creationDate);
    requestObject[event.eventCode].push(eventObject);
    requestObject.customObjects.push(customObject);
    counter++;
  }
  return requestObjectList;
}

function sendAnalyticsEvents(requestObjectList) {
  requestObjectList.forEach((requestObject) => {
    const { customObjects, ...request } = requestObject;
    const submission = AnalyticsService.submitData(request);
    if (submission.data) {
      customObjects.forEach((customObject) => {
        updateProcessingStatus(
          customObject,
          analyticsConstants.processingStatus.PROCESSED,
        );
      });
    } else {
      customObjects.forEach((customObject) => {
        if (customObject.custom.retryCount > 2) {
          updateProcessingStatus(
            customObject,
            analyticsConstants.processingStatus.SKIPPED,
          );
        } else {
          updateCounter(customObject);
        }
      });
      throw new Error('Failed to submit full payload for grouped objects.');
    }
  });
}

function processAnalytics() {
  const query = 'custom.processingStatus = {0}';
  const queryArgs = [analyticsConstants.processingStatus.NOT_PROCESSED];
  let customObjectIterator = null;
  try {
    // Query the custom objects by processing status
    customObjectIterator = CustomObjectMgr.queryCustomObjects(
      analyticsConstants.analyticsEventObjectId,
      query,
      null,
      queryArgs,
    );
    const analyticsRequest = createAnalyticsRequest(customObjectIterator);
    sendAnalyticsEvents(analyticsRequest);
  } catch (e) {
    AdyenLogs.error_log(`Error querying custom objects: ${e}`);
    throw e;
  } finally {
    if (customObjectIterator) {
      customObjectIterator.close();
    }
  }
}

function clearAnalytics() {
  let customObjectIterator = null;
  try {
    const query =
      'custom.processingStatus = {0} OR custom.processingStatus = {1}';
    const queryArgs = [
      analyticsConstants.processingStatus.SKIPPED,
      analyticsConstants.processingStatus.PROCESSED,
    ];
    customObjectIterator = CustomObjectMgr.queryCustomObjects(
      analyticsConstants.analyticsEventObjectId,
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
  processAnalytics,
  clearAnalytics,
};
