const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const UUIDUtils = require('dw/util/UUIDUtils');
const Transaction = require('dw/system/Transaction');
const constants = require('*/cartridge/adyen/analytics/constants');

function createCustomObject(
  objectId,
  referenceId,
  eventSource,
  eventType,
  eventCode,
  eventDate,
) {
  Transaction.wrap(() => {
    const uuid = UUIDUtils.createUUID();
    const customObj = CustomObjectMgr.createCustomObject(objectId, uuid);
    customObj.custom.referenceId = referenceId;
    customObj.custom.eventSource = eventSource;
    customObj.custom.eventType = eventType;
    customObj.custom.eventCode = eventCode;
    customObj.custom.processingStatus =
      constants.processingStatus.NOT_PROCESSED;
    customObj.custom.retryCount = 0;
    if (eventDate) {
      customObj.custom.eventDate = eventDate;
    }
  });
}

function createConfigurationTimeEvent(
  referenceId,
  eventSource,
  eventType,
  eventCode,
  eventDate,
) {
  createCustomObject(
    constants.configurationTimeEventObjectId,
    referenceId,
    eventSource,
    eventType,
    eventCode,
    eventDate,
  );
}

function createAnalyticsEvent(referenceId, eventSource, eventType, eventCode) {
  createCustomObject(
    constants.analyticsEventObjectId,
    referenceId,
    eventSource,
    eventType,
    eventCode,
  );
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
  createConfigurationTimeEvent,
  deleteAnalyticsEvent,
  updateAnalyticsEvent,
};
