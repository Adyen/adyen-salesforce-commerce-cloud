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
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const {
  createOrUpdateCustomObject,
  setCustomObjectStatus,
  createLogMessage,
} = require('./utils/customObjectHelper');

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
    const customObj = createOrUpdateCustomObject(
      'adyenNotification',
      keyValue,
      notificationData,
    );

    setCustomObjectStatus(
      customObj,
      notificationData.eventCode,
      notificationData.merchantReference,
      notificationData,
    );
    return {
      success: true,
    };
  } catch (error) {
    AdyenLogs.error_log('Notification failed', error);
    return {
      success: false,
      errorMessage: error.message,
    };
  }
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

function execute(args) {
  return notifyHttpParameterMap(args.CurrentHttpParameterMap);
}

module.exports = {
  execute,
  notify,
  notifyHttpParameterMap,
};
