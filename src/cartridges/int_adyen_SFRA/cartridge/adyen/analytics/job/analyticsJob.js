const Transaction = require('dw/system/Transaction');
const analyticsConstants = require('*/cartridge/adyen/analytics/constants');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const AnalyticsService = require('../analyticsService');
const { processEvents, clearEvents } = require('../analyticsUtils');

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

function isRequestObjectFull(requestObject) {
  return Object.keys(eventCodeList).some((key) => {
    const eventCode = eventCodeList[key];
    return requestObject[eventCode.name].length >= eventCode.limit;
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

function addEventObject(customObject, requestObjectList) {
  const { creationDate, custom: event } = customObject;
  const requestObject = requestObjectList.slice(-1)[0];
  const eventObject = {
    timestamp: event.eventDate || new Date(creationDate).getTime().toString(),
    type: event.eventType?.value,
    target: event.referenceId,
    id: event.eventId,
    component: event.eventSource,
  };
  if (event.eventCode?.value === analyticsConstants.eventCode.ERROR) {
    delete eventObject.type;
    delete eventObject.target;
    eventObject.errorType = analyticsConstants.errorType;
  }

  if (!isRequestObjectFull(requestObject)) {
    return [
      ...requestObjectList.slice(0, -1),
      {
        ...defaultProperties,
        ...requestObject,
        [event.eventCode]: requestObject[event.eventCode].concat([
          { ...eventObject },
        ]),
        customObjects: requestObject.customObjects.concat([customObject]),
      },
    ];
  }
  return [
    ...requestObjectList,
    {
      ...defaultProperties,
      [event.eventCode]: [].concat([{ ...eventObject }]),
      customObjects: [].concat([customObject]),
    },
  ];
}

function createAnalyticsRequest(customObjectIterator) {
  let counter = 0;
  let requestObjectList = [];
  requestObjectList.push({ ...defaultProperties });
  while (customObjectIterator.hasNext()) {
    if (counter >= analyticsConstants.EVENT_LIMIT) {
      break;
    }
    const customObject = customObjectIterator.next();
    requestObjectList = addEventObject(customObject, requestObjectList);
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
  processEvents(analyticsConstants.analyticsEventObjectId);
}

function clearAnalytics() {
  clearEvents(analyticsConstants.analyticsEventObjectId);
}

module.exports = {
  processAnalytics,
  clearAnalytics,
  createAnalyticsRequest,
  sendAnalyticsEvents,
};
