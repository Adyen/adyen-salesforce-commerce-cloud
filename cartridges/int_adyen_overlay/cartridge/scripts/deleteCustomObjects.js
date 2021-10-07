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

function execute(args) {
  return handle(args.orderID);
}

function handle(orderID) {
  var queryString = "custom.orderId LIKE '".concat(orderID, "*'");
  var searchQuery = CustomObjectMgr.queryCustomObjects('adyenNotification', queryString, null);

  if (searchQuery.count > 0) {
    dw.system.Logger.getLogger('Adyen', 'adyen').info('Removing related Custom Objects with merchantReference {0} with count {1}', orderID, searchQuery.count);
  }

  while (searchQuery.hasNext()) {
    var co = searchQuery.next();
    remove(co);
  }

  searchQuery.close();
  return PIPELET_NEXT;
}

function remove(co) {
  dw.system.Logger.getLogger('Adyen', 'adyen').info('Remove CO object with merchantReference {0} and pspReferenceNumber  {1}', co.custom.merchantReference, co.custom.pspReference);

  try {
    CustomObjectMgr.remove(co);
  } catch (e) {
    dw.system.Logger.getLogger('Adyen', 'adyen').error('Error occured during delete CO, ID: {0}, erorr message {1}', co.custom.orderId, e.message);
  }
}

module.exports = {
  execute: execute,
  handle: handle,
  remove: remove
};