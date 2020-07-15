/**
 * Deletes recurring payment instrument from Adyen
 *
 * @input RecurringDetailReference : String
 * @input Customer : dw.customer.Customer
 */

/* API Includes */
const Logger = require('dw/system/Logger');

/* Script Modules */
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function deleteRecurringPayment(args) {
  try {
    const service = AdyenHelper.getService(
      AdyenHelper.SERVICE.RECURRING_DISABLE,
    );
    if (!service) {
      throw new Error('Could not do /disable call');
    }

    const customer = args.Customer ? args.Customer : null;
    const profile = customer && customer.registered && customer.getProfile()
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
      merchantAccount: AdyenHelper.getAdyenMerchantAccount(),
      shopperReference: customerID,
      recurringDetailReference: recurringDetailReference,
      contract: 'ONECLICK',
    };

    const apiKey = AdyenHelper.getAdyenApiKey();
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-KEY', apiKey);

    const callResult = service.call(JSON.stringify(requestObject));

    if (!callResult.isOk()) {
      throw new Error(
        `/disable Call error code${
          callResult.getError().toString()
        } Error => ResponseStatus: ${
          callResult.getStatus()
        } | ResponseErrorText: ${
          callResult.getErrorMessage()
        } | ResponseText: ${
          callResult.getMsg()}`,
      );
    }
  } catch (e) {
    Logger.getLogger('Adyen').fatal(
      `Adyen: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
    );
  }
}

module.exports = {
  deleteRecurringPayment: deleteRecurringPayment,
};
