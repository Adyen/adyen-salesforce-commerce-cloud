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
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const constants = require('*/cartridge/adyenConstants/constants');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

function deleteRecurringPayment(args) {
  try {
    const customer = args.Customer ? args.Customer : null;
    const profile =
      customer && customer.registered && customer.getProfile()
        ? customer.getProfile()
        : null;
    let customerID = null;
    const recurringDetailReference = args.RecurringDetailReference
      ? args.RecurringDetailReference
      : null;

    if (profile && profile.getCustomerNo()) {
      customerID = profile.getCustomerNo();
    }

    if (!(customerID && recurringDetailReference)) {
      throw new Error('No Customer ID or RecurringDetailReference provided');
    }

    const requestObject = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      shopperReference: customerID,
      recurringDetailReference,
      contract : constants.CONTRACT.ONECLICK, 
    };

    AdyenHelper.executeCall(constants.SERVICE.RECURRING_DISABLE, requestObject);
    
  } catch (e) {
    AdyenLogs.fatal_log(
      `Adyen: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
    );
  }
}

module.exports = {
  deleteRecurringPayment,
};
