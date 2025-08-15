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
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const Locale = require('dw/util/Locale');
//script includes
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function execute() {
  processNotifications();
  clearNotifications();
  return PIPELET_NEXT;
}

/**
 * ProcessNotifications - search for custom objects that need
 *  to be processed and handle them to place or fail order
 */
function processNotifications(/* pdict */) {
  const objectsHandler = require('*/cartridge/handleCustomObject');
  const searchQuery = CustomObjectMgr.queryCustomObjects(
    'adyenNotification',
    "custom.updateStatus = 'PROCESS'",
    null,
  );
  AdyenLogs.info_log(
    `Process notifications start with count ${searchQuery.count}`,
  );

  let customObj;
  let handlerResult;
  let order;
  while (searchQuery.hasNext()) {
    customObj = searchQuery.next();
    Transaction.wrap(() => {
      handlerResult = objectsHandler.handle(customObj);
    });

    /*
      Sometimes order cannot be found in DWRE DB even if it exists there,
      in that case we shouldn't reply to Adyen that all was ok in order to get a new notification
    */
    order = handlerResult.Order;
    const customerLocaleId = order.getCustomerLocaleID();
    const customerLocale = Locale.getLocale(customerLocaleId);
    if (!handlerResult.status || handlerResult.status === PIPELET_ERROR) {
      // Only CREATED orders can be failed
      if (
        !order ||
        order.status.value !== dw.order.Order.ORDER_STATUS_CREATED
      ) {
        continue;
      }
      // Refused payments which are made with using Adyen payment method are
      // handled when user is redirected back from Adyen HPP.
      // Here we shouldn't fail an order and send a notification
      Transaction.wrap(() => {
        OrderMgr.failOrder(order, true);
      });
      continue;
    }

    if (handlerResult.SkipOrder || handlerResult.Pending) {
      continue;
    }

    // Send confirmation email
    if (handlerResult.SubmitOrder) {
      COHelpers.sendConfirmationEmail(order, customerLocale);
    }
  }
  AdyenLogs.info_log(
    `Process notifications finished with count ${searchQuery.count}`,
  );
  searchQuery.close();

  return PIPELET_NEXT;
}

/**
 * cleanNotifications
 */
function clearNotifications(/* pdict */) {
  const deleteCustomObjects = require('*/cartridge/deleteCustomObjects');
  const searchQuery = CustomObjectMgr.queryCustomObjects(
    'adyenNotification',
    "custom.processedStatus = 'SUCCESS'",
    null,
  );
  AdyenLogs.info_log(
    `Removing Processed Custom Objects start with count ${searchQuery.count}`,
  );

  let customObj;
  while (searchQuery.hasNext()) {
    customObj = searchQuery.next();
    Transaction.wrap(() => {
      deleteCustomObjects.remove(customObj);
    });
  }
  AdyenLogs.info_log(
    `Removing Processed Custom Objects finished with count ${searchQuery.count}`,
  );
  searchQuery.close();

  return PIPELET_NEXT;
}

module.exports = {
  execute,
  processNotifications,
  clearNotifications,
};
