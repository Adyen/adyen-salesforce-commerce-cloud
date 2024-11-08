const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const UUIDUtils = require('dw/util/UUIDUtils');
const Transaction = require('dw/system/Transaction');
const constants = require('./constants');

function createAnalyticsEvent(
  referenceId,
  eventSource,
  eventType,
  eventStatus,
  eventCode,
) {
  Transaction.wrap(() => {
    const uuid = UUIDUtils.createUUID();
    const customObj = CustomObjectMgr.createCustomObject(
      constants.analyticsEventObjectId,
      uuid,
    );
    customObj.custom.referenceId = referenceId;
    customObj.custom.eventSource = eventSource;
    customObj.custom.eventType = eventType;
    customObj.custom.eventStatus = eventStatus;
    customObj.custom.eventCode = eventCode;
    customObj.custom.processingStatus =
      constants.processingStatus.NOT_PROCESSED;
    customObj.custom.retryCount = 0;
  });
}

function deleteAnalyticsEvent(keyValue) {
  Transaction.wrap(() => {
    const customObj = CustomObjectMgr.getCustomObject(
      constants.analyticsEventObjectId,
      keyValue,
    );
    if (customObj) {
      CustomObjectMgr.remove(customObj);
    }
  });
}

function updateAnalyticsEvent(keyValue, attributes) {
  Transaction.wrap(() => {
    const customObj = CustomObjectMgr.getCustomObject(
      constants.analyticsEventObjectId,
      keyValue,
    );
    Object.entries(attributes).forEach(([key, value]) => {
      if (Object.hasOwn(customObj.custom, key)) {
        customObj.custom[key] = value;
      }
    });
  });
}

module.exports = {
  createAnalyticsEvent,
  deleteAnalyticsEvent,
  updateAnalyticsEvent,
};
