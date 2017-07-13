/**
* Deletes recurring payment instrument from Adyen
*
* @input RecurringDetailReference : String
* @input Customer : dw.customer.Customer
*/

/* API Includes */
var Logger = require('dw/system/Logger');

/* Script Modules */
var AdyenHelper = require('int_adyen/cartridge/scripts/util/AdyenHelper');
var THIS_SCRIPT = 'int_adyen/scripts/adyenDeleteRecurringPayment.js';

function execute(args) {
    return deleteRecurringPayment(args);
}

function deleteRecurringPayment(args) {
    try {
        var requestObject = {},
            customer = !empty(args.Customer) ? args.Customer : null,
            profile = !empty(customer) && customer.registered && !empty(customer.getProfile()) ? customer.getProfile() : null,
            customerID = '',
            recurringDetailReference = !empty(args.RecurringDetailReference) ? args.RecurringDetailReference : null;

        if (!empty(profile) && !empty(profile.getCustomerNo())) {
            customerID = profile.getCustomerNo();
        }

        if (empty(customerID) || empty(recurringDetailReference)) {
            Logger.getLogger('Adyen').error(THIS_SCRIPT + ': No Customer ID or RecurringDetailReference provided');
            return PIPELET_ERROR;
        }

        requestObject['merchantAccount'] = AdyenHelper.getAdyenMerchantAccount();
        requestObject['shopperReference'] = customerID;
        requestObject['recurringDetailReference'] = recurringDetailReference;

        var callResult = null,
            service = AdyenHelper.getService(AdyenHelper.SERVICE.SEND);

        if (service == null) {
            return PIPELET_ERROR;
        }

        var serviceCredential = service.getConfiguration().getCredential();
        var serviceURL = serviceCredential.getURL();
        //https://pal-test.adyen.com/pal/servlet/Payment/v18/authorise
        serviceURL = serviceURL.replace('Payment', 'Recurring').replace('authorise', 'disable');

        service.setURL(serviceURL);
        service.addHeader('Content-type', 'application/json');
        service.addHeader('charset', 'UTF-8');
        callResult = service.call(JSON.stringify(requestObject));

        if (callResult.isOk() == false) {
            Logger.error(THIS_SCRIPT + ' Adyen: Call error code' +  callResult.getError().toString() + ' Error => ResponseStatus: ' + callResult.getStatus()  + ' | ResponseErrorText: ' +  callResult.getErrorMessage() + ' | ResponseText: ' + callResult.getMsg());
            return PIPELET_ERROR;
        }

    } catch (e) {
        Logger.getLogger('Adyen').fatal('Adyen: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
        return PIPELET_ERROR;
    }

    return PIPELET_NEXT;
}

module.exports = {
    'execute': execute,
    'deleteRecurringPayment': deleteRecurringPayment
}