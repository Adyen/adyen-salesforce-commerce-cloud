"use strict";

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }
function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }
function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }
/**
 *                       ######
 *                       ######
 * ############    ####( ######  #####. ######  ############   ############
 * #############  #####( ######  #####. ######  #############  #############
 *        ######  #####( ######  #####. ######  #####  ######  #####  ######
 * ###### ######  #####( ######  #####. ######  #####  #####   #####  ######
 * ###### ######  #####( ######  #####. ######  #####          #####  ######
 * #############  #############  #############  #############  #####  ######
 *  ############   ############  #############   ############  #####  ######
 *                                      ######
 *                               #############
 *                               ############
 * Adyen Salesforce Commerce Cloud
 * Copyright (c) 2021 Adyen B.V.
 * This file is open source and available under the MIT license.
 * See the LICENSE file for more info.
 *
 * save Adyen Notification
 * see page 22 of Adyen Integration manual
 *
 * v1 110324 : logging to file
 * v2 110325 :
 * v3 110408 : pass on OrderNo, Paymentresult for update
 * v4 130422 : Merged adyen_notify and update_order into single script
 *
 */
var Calendar = require('dw/util/Calendar');
var StringUtils = require('dw/util/StringUtils');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
function execute(args) {
  return notifyHttpParameterMap(args.CurrentHttpParameterMap);
}
function notifyHttpParameterMap(hpm) {
  if (hpm === null) {
    AdyenLogs.fatal_log('Handling of Adyen notification has failed. No input parameters were provided.');
    return PIPELET_NEXT;
  }
  var notificationData = {};
  var _iterator = _createForOfIteratorHelper(hpm.getParameterNames().toArray()),
    _step;
  try {
    for (_iterator.s(); !(_step = _iterator.n()).done;) {
      var parameterName = _step.value;
      notificationData[parameterName] = hpm[parameterName].stringValue;
    }
  } catch (err) {
    _iterator.e(err);
  } finally {
    _iterator.f();
  }
  return notify(notificationData);
}
function notify(notificationData) {
  // Check the input parameters
  if (notificationData === null) {
    AdyenLogs.fatal_log('Handling of Adyen notification has failed. No input parameters were provided.');
    return PIPELET_NEXT;
  }
  try {
    var msg = createLogMessage(notificationData);
    AdyenLogs.debug_log(msg);
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
        AdyenLogs.info_log("Received notification for merchantReference ".concat(notificationData.merchantReference, " with status ").concat(notificationData.eventCode, ". Custom Object set up to 'PROCESS' status."));
        break;
      default:
        customObj.custom.updateStatus = 'PENDING';
        AdyenLogs.info_log("Received notification for merchantReference ".concat(notificationData.merchantReference, " with status ").concat(notificationData.eventCode, ". Custom Object set up to 'PENDING' status."));
    }
    return {
      success: true
    };
  } catch (e) {
    AdyenLogs.error_log("Notification failed: ".concat(JSON.stringify(notificationData), "\n") + "Error message: ".concat(e.message));
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