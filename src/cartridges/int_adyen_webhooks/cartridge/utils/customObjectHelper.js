const Transaction = require('dw/system/Transaction');
const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const constants = require('./constants');

/**
 * Create or update a custom object with notification data in a transaction.
 * @param {string} type - The custom object type (e.g., 'adyenNotification')
 * @param {string} key - The custom object key
 * @param {Object} data - The data to assign to custom fields
 * @returns {dw.object.CustomObject} The created or updated custom object
 */
function createOrUpdateCustomObject(type, key, data) {
  let customObj;
  Transaction.wrap(() => {
    customObj = CustomObjectMgr.getCustomObject(type, key);
    if (!customObj) {
      customObj = CustomObjectMgr.createCustomObject(type, key);
    }
    for (const field in data) {
      if (Object.prototype.hasOwnProperty.call(data, field)) {
        try {
          customObj.custom[field] = data[field];
        } catch (e) {
          // unknown field, ignore
        }
      }
    }
  });
  return customObj;
}

/**
 * Sets the updateStatus and logs for a custom object based on event code.
 * Handles AUTHORISATION log field setting.
 * @param {dw.object.CustomObject} customObj
 * @param {string} eventCode
 * @param {string} merchantReference
 * @param {Object} notificationData
 */
function setCustomObjectStatus(
  customObj,
  eventCode,
  merchantReference,
  notificationData,
) {
  if (constants.PROCESS_EVENTS.includes(eventCode)) {
    customObj.custom.updateStatus = constants.UPDATE_STATUS.PROCESS;
    AdyenLogs.info_log(
      `Received notification for merchantReference ${merchantReference} with status ${eventCode}. Custom Object set up to '${constants.UPDATE_STATUS.PROCESS}' status.`,
    );
  } else {
    customObj.custom.updateStatus = constants.UPDATE_STATUS.PENDING;
    AdyenLogs.info_log(
      `Received notification for merchantReference ${merchantReference} with status ${eventCode}. Custom Object set up to '${constants.UPDATE_STATUS.PENDING}' status.`,
    );
  }
  if (eventCode === 'AUTHORISATION') {
    customObj.custom.Adyen_log = JSON.stringify(notificationData);
  }
}

module.exports = {
  createOrUpdateCustomObject,
  setCustomObjectStatus,
};
