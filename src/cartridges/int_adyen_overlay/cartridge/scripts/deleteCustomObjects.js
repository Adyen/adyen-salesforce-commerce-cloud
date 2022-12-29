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
 * Delete custom objects
 */

const CustomObjectMgr = require('dw/object/CustomObjectMgr');

//script include
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

function execute(args) {
  return handle(args.orderID);
}

function handle(orderID) {
  const queryString = `custom.orderId LIKE '${orderID}*'`;
  const searchQuery = CustomObjectMgr.queryCustomObjects(
    'adyenNotification',
    queryString,
    null,
  );
  if (searchQuery.count > 0) {
    AdyenLogs.debug_log(
      `Removing related Custom Objects with merchantReference ${orderID} with count ${searchQuery.count}`,
    );
  }
  while (searchQuery.hasNext()) {
    const co = searchQuery.next();
    remove(co);
  }
  searchQuery.close();
  return PIPELET_NEXT;
}

function remove(co) {
  AdyenLogs.info_log(
    `Remove CO object with merchantReference ${co.custom.merchantReference} and pspReferenceNumber ${co.custom.pspReference}`,
  );
  try {
    CustomObjectMgr.remove(co);
  } catch (e) {
    AdyenLogs.error_log(
      `Error occured during delete CO, ID: ${co.custom.orderId}, erorr message ${e.message}`,
    );
  }
}

module.exports = {
  execute,
  handle,
  remove,
};
