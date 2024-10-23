const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const Transaction = require('dw/system/Transaction');
const constants = require('../constants');
const AnalyticsService = require('../analyticsService');
const AdyenLogs = require('../../logs/adyenCustomLogs');

function createRequestObjectForAllReferenceIds(groupedObjects) {
  const requestObject = {
    channel: 'Web',
    platform: 'Web',
    info: [],
    error: [],
    log: [],
  };

  // Iterate over all referenceIds and group events into one requestObject
  Object.keys(groupedObjects).forEach((referenceId) => {
    const events = groupedObjects[referenceId];

    events.forEach((event) => {
      const eventObject = {
        timestamp: new Date(event.creationDate).getTime().toString(),
        type: 'focus', // this has to be changed once API accepts our event types
        target: event.eventStatus,
        id: event.eventId,
        component: event.eventSource,
      };

      if (event.eventCode.toLowerCase() === constants.eventCode.INFO) {
        requestObject.info.push(eventObject);
      } else if (event.eventCode.toLowerCase() === constants.eventCode.ERROR) {
        requestObject.error.push(eventObject);
      } else if (event.eventCode.toLowerCase() === constants.eventCode.LOG) {
        requestObject.log.push(eventObject);
      }
    });
  });

  // Remove empty arrays (API doesn't accept empty ones)
  if (requestObject.info.length === 0) delete requestObject.info;
  if (requestObject.error.length === 0) delete requestObject.error;
  if (requestObject.log.length === 0) delete requestObject.log;

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

function updateProcessingStatus(customObject, status) {
  try {
    Transaction.wrap(() => {
      customObject.custom.processingStatus = status;
    });
  } catch (e) {
    AdyenLogs.error_log('Error updating processing status:', e);
  }
}

function processData() {
  const query = 'custom.processingStatus = {0}';
  const queryArgs = [constants.processingStatus.NOT_PROCESSED];
  let customObjectIterator = null;
  const groupedObjects = {};

  try {
    // Query the custom objects by processing status
    customObjectIterator = CustomObjectMgr.queryCustomObjects(
      constants.analyticsEventObjectId,
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
    const submissionSuccess = AnalyticsService.submitData(payload);
    if (submissionSuccess) {
      customObjectsToDelete.forEach((customObject) => {
        deleteCustomObject(customObject);
      });
    } else {
      AdyenLogs.error_log('Failed to submit full payload for grouped objects.');
      // This will be triggered upon completion of SFI-991
      customObjectsToDelete.forEach((customObject) => {
        updateProcessingStatus(
          customObject,
          constants.processingStatus.SKIPPED,
        );
      });
    }
  } catch (e) {
    AdyenLogs.error_log(`Error querying custom objects: ${e}`);
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
