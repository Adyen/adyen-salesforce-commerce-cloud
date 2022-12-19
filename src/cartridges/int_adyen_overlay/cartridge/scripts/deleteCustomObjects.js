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
    AdyenLogs.info_log.info(
      'Removing related Custom Objects with merchantReference {0} with count {1}',
      orderID,
      searchQuery.count,
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
  AdyenLogs.info_log.info(
    'Remove CO object with merchantReference {0} and pspReferenceNumber  {1}',
    co.custom.merchantReference,
    co.custom.pspReference,
  );
  try {
    CustomObjectMgr.remove(co);
  } catch (e) {
    AdyenLogs.error_log.error(
      'Error occured during delete CO, ID: {0}, erorr message {1}',
      co.custom.orderId,
      e.message,
    );
  }
}

module.exports = {
  execute,
  handle,
  remove,
};
