const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const Transaction = require('dw/system/Transaction');
const analyticsConstants = require('*/cartridge/adyen/analytics/constants');
const constants = require('*/cartridge/adyen/config/constants');
const AnalyticsService = require('../analyticsService');
const AdyenLogs = require('../../logs/adyenCustomLogs');

const defaultProperties = {
  channel: 'Web',
  platform: 'Web',
};

const eventCodeList = {
  [analyticsConstants.eventCode.INFO]: {
    name: analyticsConstants.eventCode.INFO,
    limit: 50,
  },
  [analyticsConstants.eventCode.ERROR]: {
    name: analyticsConstants.eventCode.ERROR,
    limit: 10,
  },
  [analyticsConstants.eventCode.LOG]: {
    name: analyticsConstants.eventCode.LOG,
    limit: 10,
  },
};

function getRequestObject(requestObjectList) {
  const lastRequestObject = requestObjectList[requestObjectList.length - 1];
  return Object.keys(eventCodeList).some((eventCode) => {
    if (
      Object.prototype.hasOwnProperty.call(lastRequestObject, eventCode.name) &&
      lastRequestObject[eventCode.name].length > eventCode.limit
    ) {
      requestObjectList.push({ ...defaultProperties });
      return requestObjectList[requestObjectList.length - 1];
    }
    return lastRequestObject;
  });
}

function createRequestObjectForAllReferenceIds(groupedObjects) {
  const requestObjectList = [];
  requestObjectList.push({ ...defaultProperties });
  // Iterate over all referenceIds and group events into one requestObject
  Object.keys(groupedObjects).forEach((referenceId) => {
    const events = groupedObjects[referenceId];

    events.forEach((event) => {
      const requestObject = getRequestObject(requestObjectList);
      const eventCode = event.eventCode.toLowerCase();
      const eventObject = {
        timestamp: new Date(event.creationDate).getTime().toString(),
        type: event.eventType,
        target: event.referenceId,
        id: event.eventId,
        component: event.eventSource,
      };
      if (eventCode === analyticsConstants.eventCode.ERROR) {
        delete eventObject.type;
        delete eventObject.target;
        eventObject.errorType = constants.errorType;
      }

      if (Object.keys(eventCodeList).includes(eventCode)) {
        if (!requestObject[eventCode]) {
          requestObject[eventCode] = [];
        }
        requestObject[eventCode].push(eventObject);
      }
    });
  });

  return requestObjectList;
}

function deleteCustomObject(customObject) {
  try {
    Transaction.wrap(() => {
      CustomObjectMgr.remove(customObject);
    });
  } catch (e) {
    AdyenLogs.error_log('Error deleting custom object:', e);
  }
}

function iterateCustomObjects(
  customObjectIterator,
  groupedObjects,
  customObjectsToDelete,
) {
  while (customObjectIterator.hasNext()) {
    const customObject = customObjectIterator.next();
    const { referenceId } = customObject.custom;
    const combinedFields = {};

    if (!groupedObjects[referenceId]) {
      groupedObjects[referenceId] = [];
    }

    // Extract custom fields
    Object.keys(customObject.custom).forEach((fieldName) => {
      combinedFields[fieldName] = customObject.custom[fieldName]?.toString();
    });
    combinedFields.creationDate = customObject.creationDate;
    groupedObjects[referenceId].push(combinedFields);

    customObjectsToDelete.push(customObject);
  }
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

function processData() {
  const query = 'custom.processingStatus = {0}';
  const queryArgs = [analyticsConstants.processingStatus.NOT_PROCESSED];
  let customObjectIterator = null;
  const groupedObjects = {};

  try {
    // Query the custom objects by processing status
    customObjectIterator = CustomObjectMgr.queryCustomObjects(
      analyticsConstants.analyticsEventObjectId,
      query,
      null,
      queryArgs,
    );
    const customObjectsToDelete = [];

    iterateCustomObjects(
      customObjectIterator,
      groupedObjects,
      customObjectsToDelete,
    );

    const payload = createRequestObjectForAllReferenceIds(groupedObjects);

    const submission = AnalyticsService.submitData(payload);
    if (submission.data) {
      customObjectsToDelete.forEach((customObject) => {
        deleteCustomObject(customObject);
      });
    } else {
      customObjectsToDelete.forEach((customObject) => {
        if (customObject.custom.retryCount > 2) {
          deleteCustomObject(customObject);
        } else {
          updateCounter(customObject);
        }
      });
      throw new Error('Failed to submit full payload for grouped objects.');
    }
  } catch (e) {
    AdyenLogs.error_log(`Error querying custom objects: ${e}`);
    throw e;
  } finally {
    if (customObjectIterator) {
      customObjectIterator.close();
    }
  }
  return groupedObjects;
}

module.exports = {
  processData,
};
