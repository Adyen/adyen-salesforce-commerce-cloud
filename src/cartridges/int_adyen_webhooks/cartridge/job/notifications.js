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
 * Script to run Adyen notification related jobs
 */

/* API Includes */
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const CustomObjectMgr = require('dw/object/CustomObjectMgr');
const Locale = require('dw/util/Locale');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
// script includes
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const deleteCustomObjects = require('*/cartridge/deleteCustomObjects');
const objectsHandler = require('*/cartridge/handleCustomObject');

/**
 * Handles failed order scenarios
 * @param {Object} handlerResult - The result from the handler
 * @param {Object} order - The order object
 * @returns {boolean} True if processing should continue, false if should skip
 */
function handleFailedOrder(handlerResult, order) {
  if (!handlerResult.status || handlerResult.status === PIPELET_ERROR) {
    // Only CREATED orders can be failed
    if (!order || order.status.value !== dw.order.Order.ORDER_STATUS_CREATED) {
      return false;
    }
    // Refused payments which are made with using Adyen payment method are
    // handled when user is redirected back from Adyen HPP.
    // Here we shouldn't fail an order and send a notification
    Transaction.wrap(() => {
      OrderMgr.failOrder(order, true);
    });
    return false;
  }
  return true;
}

/**
 * Handles successful order processing
 * @param {Object} handlerResult - The result from the handler
 * @param {Object} order - The order object
 * @returns {boolean} True if processing should continue, false if should skip
 */
function handleSuccessfulOrder(handlerResult, order) {
  if (handlerResult.SkipOrder || handlerResult.Pending) {
    return false;
  }

  // Send confirmation email
  if (handlerResult.SubmitOrder) {
    const customerLocaleId = order.getCustomerLocaleID();
    const customerLocale = Locale.getLocale(customerLocaleId);
    COHelpers.sendConfirmationEmail(order, customerLocale);
  }
  return true;
}

/**
 * Processes a single notification custom object
 * @param {Object} customObj - The custom object to process
 */
function processNotificationItem(customObj) {
  let handlerResult;
  Transaction.wrap(() => {
    handlerResult = objectsHandler.handle(customObj);
  });

  /*
    Sometimes order cannot be found in DWRE DB even if it exists there,
    in that case we shouldn't reply to Adyen that all was ok in order to get a new notification
  */
  const order = handlerResult.Order;

  if (!handleFailedOrder(handlerResult, order)) {
    return;
  }

  handleSuccessfulOrder(handlerResult, order);
}

/**
 * ProcessNotifications - search for custom objects that need
 *  to be processed and handle them to place or fail order
 */
function processNotifications(/* pdict */) {
  const searchQuery = CustomObjectMgr.queryCustomObjects(
    'adyenNotification',
    "custom.updateStatus = 'PROCESS'",
    null,
  );
  AdyenLogs.info_log(
    `Process notifications start with count ${searchQuery.count}`,
  );

  while (searchQuery.hasNext()) {
    const customObj = searchQuery.next();
    processNotificationItem(customObj);
  }

  AdyenLogs.info_log(
    `Process notifications finished with count ${searchQuery.count}`,
  );
  searchQuery.close();

  return PIPELET_NEXT;
}

/**
 * Removes a single processed custom object
 * @param {Object} customObj - The custom object to remove
 */
function removeProcessedCustomObject(customObj) {
  Transaction.wrap(() => {
    deleteCustomObjects.remove(customObj);
  });
}

/**
 * cleanNotifications
 */
function clearNotifications(/* pdict */) {
  const searchQuery = CustomObjectMgr.queryCustomObjects(
    'adyenNotification',
    "custom.processedStatus = 'SUCCESS'",
    null,
  );
  AdyenLogs.info_log(
    `Removing Processed Custom Objects start with count ${searchQuery.count}`,
  );

  while (searchQuery.hasNext()) {
    const customObj = searchQuery.next();
    removeProcessedCustomObject(customObj);
  }
  AdyenLogs.info_log(
    `Removing Processed Custom Objects finished with count ${searchQuery.count}`,
  );
  searchQuery.close();

  return PIPELET_NEXT;
}

function execute() {
  processNotifications();
  clearNotifications();
  return PIPELET_NEXT;
}

module.exports = {
  execute,
  processNotifications,
  clearNotifications,
};
