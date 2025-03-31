const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const Transaction = require('dw/system/Transaction');
const analyticsConstants = require('*/cartridge/adyen/analytics/constants');
const constants = require('*/cartridge/adyen/config/constants');
const AnalyticsService = require('../analyticsService');
const AdyenLogs = require('../../logs/adyenCustomLogs');

function createRequestObjectForAllReferenceIds(groupedObjects) {
  const requestObject = {
    channel: 'Web',
    platform: 'Web',
  };

  // Iterate over all referenceIds and group events into one requestObject
  Object.keys(groupedObjects).forEach((referenceId) => {
    const events = groupedObjects[referenceId];

    events.forEach((event) => {
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
      const eventCodeList = [
        analyticsConstants.eventCode.INFO,
        analyticsConstants.eventCode.ERROR,
        analyticsConstants.eventCode.LOG,
      ];

      if (eventCodeList.includes(eventCode)) {
        if (!requestObject[eventCode]) {
          requestObject[eventCode] = [];
        }
        requestObject[eventCode].push(eventObject);
      }
    });
  });

  return requestObject;
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
