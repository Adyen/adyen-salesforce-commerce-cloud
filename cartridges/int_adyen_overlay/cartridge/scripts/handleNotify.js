"use strict";

/**
 * save Adyen Notification
 * see page 22 of Adyen Integration manual
 *
 * v1 110324 : logging to file
 * v2 110325 :
 * v3 110408 : pass on OrderNo, Paymentresult for update
 * v4 130422 : Merged adyen_notify and update_order into single script
 *
 * @input CurrentHttpParameterMap : Object
 *
 */
var Logger = require('dw/system/Logger');

var Calendar = require('dw/util/Calendar');

var StringUtils = require('dw/util/StringUtils');

var CustomObjectMgr = require('dw/object/CustomObjectMgr');

function execute(args) {
  return notifyHttpParameterMap(args.CurrentHttpParameterMap);
}

function notifyHttpParameterMap(hpm) {
  if (hpm === null) {
    Logger.getLogger('Adyen', 'adyen').fatal('Handling of Adyen notification has failed. No input parameters were provided.');
    return PIPELET_NEXT;
  }

  var notificationData = {};

  for (var param in hpm.parameterNames) {
    notificationData[param] = hpm[param].stringValue;
  }

  return notify(notificationData);
}

function notify(notificationData) {
  // Check the input parameters
  if (notificationData === null) {
    Logger.getLogger('Adyen', 'adyen').fatal('Handling of Adyen notification has failed. No input parameters were provided.');
    return PIPELET_NEXT;
  }

  try {
    var msg = createLogMessage(notificationData);
    Logger.getLogger('Adyen').debug(msg);
    var calObj = new Calendar();
    var keyValue = "".concat(notificationData.merchantReference, "-").concat(StringUtils.formatCalendar(calObj, 'yyyyMMddhhmmssSSS'));
    var customObj = CustomObjectMgr.createCustomObject('adyenNotification', keyValue);

    for (var field in notificationData) {
      try {
        customObj.custom[field] = notificationData[field];
      } catch (e) {
        /* unknown field */
      }
    }

    switch (notificationData.eventCode) {
      case 'AUTHORISATION':
        // Save all request to custom attribute for Authorization event
        customObj.custom.Adyen_log = JSON.stringify(notificationData);
      // eslint-disable-next-line no-fallthrough

      case 'CANCELLATION':
      case 'CANCEL_OR_REFUND':
      case 'REFUND':
      case 'CAPTURE_FAILED':
      case 'ORDER_OPENED':
      case 'ORDER_CLOSED':
      case 'OFFER_CLOSED':
      case 'PENDING':
      case 'CAPTURE':
        customObj.custom.updateStatus = 'PROCESS';
        Logger.getLogger('Adyen').info("Received notification for merchantReference {0} with status {1}. Custom Object set up to 'PROCESS' status.", notificationData.merchantReference, notificationData.eventCode);
        break;

      default:
        customObj.custom.updateStatus = 'PENDING';
        Logger.getLogger('Adyen').info("Received notification for merchantReference {0} with status {1}. Custom Object set up to 'PENDING' status.", notificationData.merchantReference, notificationData.eventCode);
    }

    return {
      success: true
    };
  } catch (e) {
    Logger.getLogger('Adyen', 'adyen').error("Notification failed: ".concat(JSON.stringify(notificationData), "\n") + "Error message: ".concat(e.message));
    return {
      success: false,
      errorMessage: e.message
    };
  }
}

function createLogMessage(notificationData) {
  var VERSION = '4d';
  var msg = '';
  msg = "AdyenNotification v ".concat(VERSION);
  msg += '\n================================================================\n';
  msg = "".concat(msg, "reason : ").concat(notificationData.reason);
  msg = "".concat(msg, "\neventDate : ").concat(notificationData.eventDate);
  msg = "".concat(msg, "\nmerchantReference : ").concat(notificationData.merchantReference);
  msg = "".concat(msg, "\ncurrency : ").concat(notificationData.currency);
  msg = "".concat(msg, "\npspReference : ").concat(notificationData.pspReference);
  msg = "".concat(msg, "\nmerchantAccountCode : ").concat(notificationData.merchantAccountCode);
  msg = "".concat(msg, "\neventCode : ").concat(notificationData.eventCode);
  msg = "".concat(msg, "\nvalue : ").concat(notificationData.value);
  msg = "".concat(msg, "\noperations : ").concat(notificationData.operations);
  msg = "".concat(msg, "\nsuccess : ").concat(notificationData.success);
  msg = "".concat(msg, "\npaymentMethod : ").concat(notificationData.paymentMethod);
  msg = "".concat(msg, "\nlive : ").concat(notificationData.live);
  return msg;
}

module.exports = {
  execute: execute,
  notify: notify,
  notifyHttpParameterMap: notifyHttpParameterMap
};