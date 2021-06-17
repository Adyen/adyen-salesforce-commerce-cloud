"use strict";

/**
 * Deletes recurring payment instrument from Adyen
 *
 * @input RecurringDetailReference : String
 * @input Customer : dw.customer.Customer
 */

/* API Includes */
var Logger = require('dw/system/Logger');
/* Script Modules */


var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function deleteRecurringPayment(args) {
  try {
    var service = AdyenHelper.getService(AdyenHelper.SERVICE.RECURRING_DISABLE);

    if (!service) {
      throw new Error('Could not do /disable call');
    }

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
      merchantAccount: AdyenHelper.getAdyenMerchantAccount(),
      shopperReference: customerID,
      recurringDetailReference: recurringDetailReference,
      contract: 'ONECLICK'
    };
    var apiKey = AdyenHelper.getAdyenApiKey();
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-KEY', apiKey);
    var callResult = service.call(JSON.stringify(requestObject));

    if (!callResult.isOk()) {
      throw new Error("/disable Call error code".concat(callResult.getError().toString(), " Error => ResponseStatus: ").concat(callResult.getStatus(), " | ResponseErrorText: ").concat(callResult.getErrorMessage(), " | ResponseText: ").concat(callResult.getMsg()));
    }
  } catch (e) {
    Logger.getLogger('Adyen').fatal("Adyen: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
  }
}

module.exports = {
  deleteRecurringPayment: deleteRecurringPayment
};