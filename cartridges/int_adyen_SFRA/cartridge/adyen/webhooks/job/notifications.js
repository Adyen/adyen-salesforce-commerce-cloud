"use strict";

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
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');

//script includes
var AdyenLogs = require('../../logs/adyenCustomLogs');
function execute() {
  processNotifications();
  clearNotifications();
  return PIPELET_NEXT;
}

/**
 * ProcessNotifications - search for custom objects that need
 *  to be processed and handle them to place or fail order
 */
function processNotifications(/* pdict */
) {
  var objectsHandler = require('*/cartridge/adyen/webhooks/handleCustomObject');
  var searchQuery = CustomObjectMgr.queryCustomObjects('adyenNotification', "custom.updateStatus = 'PROCESS'", null);
  AdyenLogs.info_log("Process notifications start with count ".concat(searchQuery.count));
  var customObj;
  var handlerResult;
  var order;
  while (searchQuery.hasNext()) {
    customObj = searchQuery.next();
    Transaction.wrap(function () {
      handlerResult = objectsHandler.handle(customObj);
    });

    /*
      Sometimes order cannot be found in DWRE DB even if it exists there,
      in that case we shouldn't reply to Adyen that all was ok in order to get a new notification
    */

    order = handlerResult.Order;
    if (!handlerResult.status || handlerResult.status === PIPELET_ERROR) {
      // Only CREATED orders can be failed
      if (order === null || order.status.value !== dw.order.Order.ORDER_STATUS_CREATED || handlerResult.RefusedHpp) {
        continue;
      }
      // Refused payments which are made with using Adyen payment method are
      // handled when user is redirected back from Adyen HPP.
      // Here we shouldn't fail an order and send a notification
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
      continue;
    }
    if (handlerResult.SkipOrder || handlerResult.Pending) {
      continue;
    }

    // Submitting an order -> update status and send all required email
    if (handlerResult.SubmitOrder) {
      var placeOrderResult = submitOrder(order);
      if (!placeOrderResult.order_created || placeOrderResult.error) {
        AdyenLogs.error_log("Failed to place an order: ".concat(order.orderNo, ", during notification process."));
      }
    }
  }
  AdyenLogs.info_log("Process notifications finished with count ".concat(searchQuery.count));
  searchQuery.close();
  return PIPELET_NEXT;
}

/**
 * cleanNotifications
 */
function clearNotifications(/* pdict */
) {
  var deleteCustomObjects = require('*/cartridge/adyen/webhooks/deleteCustomObjects');
  var searchQuery = CustomObjectMgr.queryCustomObjects('adyenNotification', "custom.processedStatus = 'SUCCESS'", null);
  AdyenLogs.info_log("Removing Processed Custom Objects start with count ".concat(searchQuery.count));
  var customObj;
  while (searchQuery.hasNext()) {
    customObj = searchQuery.next();
    Transaction.wrap(function () {
      deleteCustomObjects.remove(customObj);
    });
  }
  AdyenLogs.info_log("Removing Processed Custom Objects finished with count ".concat(searchQuery.count));
  searchQuery.close();
  return PIPELET_NEXT;
}

/**
 * Submits an order, original function located in OrderModel, but we need to
 *  manage triggering of email
 * @param order {dw.order.Order} The order object to be submitted.
 * @transactional
 * @return {Object} object If order cannot be placed, object.error is set to true.
 * Ortherwise, object.order_created is true, and object.Order is set to the order.
 */
function submitOrder(order) {
  var adyenService = require('*/cartridge/adyen/utils/adyenService');
  return adyenService.submit(order);
}
module.exports = {
  execute: execute,
  processNotifications: processNotifications,
  clearNotifications: clearNotifications
};