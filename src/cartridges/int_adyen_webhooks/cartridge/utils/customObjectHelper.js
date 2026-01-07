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

/**
 * Creates a log message string for Adyen notification data
 * @param {Object} notificationData
 * @returns {string}
 */
function createLogMessage(notificationData) {
  const VERSION = notificationData.version;
  let msg = '';
  msg = `AdyenNotification v ${VERSION}`;
  msg += '\n================================================================\n';
  msg = `${msg}reason : ${notificationData.reason}`;
  msg = `${msg}\neventDate : ${notificationData.eventDate}`;
  msg = `${msg}\nmerchantReference : ${notificationData.merchantReference}`;
  msg = `${msg}\ncurrency : ${notificationData.currency}`;
  msg = `${msg}\npspReference : ${notificationData.pspReference}`;
  msg = `${msg}\nmerchantAccountCode : ${notificationData.merchantAccountCode}`;
  msg = `${msg}\neventCode : ${notificationData.eventCode}`;
  msg = `${msg}\nvalue : ${notificationData.value}`;
  msg = `${msg}\noperations : ${notificationData.operations}`;
  msg = `${msg}\nsuccess : ${notificationData.success}`;
  msg = `${msg}\npaymentMethod : ${notificationData.paymentMethod}`;
  msg = `${msg}\nlive : ${notificationData.live}`;
  return msg;
}

module.exports = {
  createOrUpdateCustomObject,
  setCustomObjectStatus,
  createLogMessage,
};
