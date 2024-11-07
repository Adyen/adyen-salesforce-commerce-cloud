"use strict";

function _createForOfIteratorHelper(r, e) { var t = "undefined" != typeof Symbol && r[Symbol.iterator] || r["@@iterator"]; if (!t) { if (Array.isArray(r) || (t = _unsupportedIterableToArray(r)) || e && r && "number" == typeof r.length) { t && (r = t); var _n = 0, F = function F() {}; return { s: F, n: function n() { return _n >= r.length ? { done: !0 } : { done: !1, value: r[_n++] }; }, e: function e(r) { throw r; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var o, a = !0, u = !1; return { s: function s() { t = t.call(r); }, n: function n() { var r = t.next(); return a = r.done, r; }, e: function e(r) { u = !0, o = r; }, f: function f() { try { a || null == t["return"] || t["return"](); } finally { if (u) throw o; } } }; }
function _unsupportedIterableToArray(r, a) { if (r) { if ("string" == typeof r) return _arrayLikeToArray(r, a); var t = {}.toString.call(r).slice(8, -1); return "Object" === t && r.constructor && (t = r.constructor.name), "Map" === t || "Set" === t ? Array.from(r) : "Arguments" === t || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(t) ? _arrayLikeToArray(r, a) : void 0; } }
function _arrayLikeToArray(r, a) { (null == a || a > r.length) && (a = r.length); for (var e = 0, n = Array(a); e < a; e++) n[e] = r[e]; return n; }
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
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
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
      case 'DONATION':
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
  } catch (error) {
    AdyenLogs.error_log('Notification failed', error);
    return {
      success: false,
      errorMessage: error.message
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