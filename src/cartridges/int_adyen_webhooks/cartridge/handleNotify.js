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
const Calendar = require('dw/util/Calendar');
const StringUtils = require('dw/util/StringUtils');
const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function execute(args) {
  return notifyHttpParameterMap(args.CurrentHttpParameterMap);
}

function notifyHttpParameterMap(hpm) {
  if (hpm === null) {
    AdyenLogs.fatal_log(
      'Handling of Adyen notification has failed. No input parameters were provided.',
    );
    return PIPELET_NEXT;
  }

  const notificationData = {};
  for (const parameterName of hpm.getParameterNames().toArray()) {
    notificationData[parameterName] = hpm[parameterName].stringValue;
  }

  return notify(notificationData);
}
function notify(notificationData) {
  // Check the input parameters
  if (notificationData === null) {
    AdyenLogs.fatal_log(
      'Handling of Adyen notification has failed. No input parameters were provided.',
    );
    return PIPELET_NEXT;
  }

  try {
    const msg = createLogMessage(notificationData);
    AdyenLogs.debug_log(msg);
    const calObj = new Calendar();
    const keyValue = `${
      notificationData.merchantReference
    }-${StringUtils.formatCalendar(calObj, 'yyyyMMddhhmmssSSS')}`;
    const customObj = CustomObjectMgr.createCustomObject(
      'adyenNotification',
      keyValue,
    );
    for (const field in notificationData) {
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
        AdyenLogs.info_log(
          `Received notification for merchantReference ${notificationData.merchantReference} with status ${notificationData.eventCode}. Custom Object set up to 'PROCESS' status.`,
        );
        break;
      default:
        customObj.custom.updateStatus = 'PENDING';
        AdyenLogs.info_log(
          `Received notification for merchantReference ${notificationData.merchantReference} with status ${notificationData.eventCode}. Custom Object set up to 'PENDING' status.`,
        );
    }
    return {
      success: true,
    };
  } catch (error) {
    AdyenLogs.error_log('Notification failed',error);
    return {
      success: false,
      errorMessage: error.message,
    };
  }
}

function createLogMessage(notificationData) {
  const VERSION = '4d';
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
  execute,
  notify,
  notifyHttpParameterMap,
};
