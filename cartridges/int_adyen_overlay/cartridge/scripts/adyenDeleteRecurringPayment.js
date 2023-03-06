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
 * Deletes recurring payment instrument from Adyen
 */

/* Script Modules */
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var constants = require('*/cartridge/adyenConstants/constants');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
function deleteRecurringPayment(args) {
  try {
    var customer = args.Customer ? args.Customer : null;
    var profile = customer && customer.registered && customer.getProfile() ? customer.getProfile() : null;
    var customerID = null;
    var recurringDetailReference = args.RecurringDetailReference ? args.RecurringDetailReference : null;
    if (profile && profile.getCustomerNo()) {
      customerID = profile.getCustomerNo();
    }
    if (!(customerID && recurringDetailReference)) {
      throw new Error('No Customer ID or RecurringDetailReference provided');
    }
    var requestObject = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      shopperReference: customerID,
      recurringDetailReference: recurringDetailReference,
      contract: constants.CONTRACT.ONECLICK
    };
    AdyenHelper.executeCall(constants.SERVICE.RECURRING_DISABLE, requestObject);
  } catch (e) {
    AdyenLogs.fatal_log("Adyen: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
  }
}
module.exports = {
  deleteRecurringPayment: deleteRecurringPayment
};