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
 * Delete custom objects
 */

var CustomObjectMgr = require('dw/object/CustomObjectMgr');

//script include
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
function execute(args) {
  return handle(args.orderID);
}
function handle(orderID) {
  var queryString = "custom.orderId LIKE '".concat(orderID, "*'");
  var searchQuery = CustomObjectMgr.queryCustomObjects('adyenNotification', queryString, null);
  if (searchQuery.count > 0) {
    AdyenLogs.debug_log("Removing related Custom Objects with merchantReference ".concat(orderID, " with count ").concat(searchQuery.count));
  }
  while (searchQuery.hasNext()) {
    var co = searchQuery.next();
    remove(co);
  }
  searchQuery.close();
  return PIPELET_NEXT;
}
function remove(co) {
  AdyenLogs.info_log("Remove CO object with merchantReference ".concat(co.custom.merchantReference, " and pspReferenceNumber ").concat(co.custom.pspReference));
  try {
    CustomObjectMgr.remove(co);
  } catch (e) {
    AdyenLogs.error_log("Error occured during delete CO, ID: ".concat(co.custom.orderId, ", erorr message ").concat(e.message));
  }
}
module.exports = {
  execute: execute,
  handle: handle,
  remove: remove
};