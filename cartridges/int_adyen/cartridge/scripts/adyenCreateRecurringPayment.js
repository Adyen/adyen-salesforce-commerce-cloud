/**
* Creates recurring payment / tokenization within Adyen
*
* @input RequestObject : Object
*
* @output Decision : String
* @output PspReference : String
* @output AdyenErrorMessage : String
*/

/* API Includes */
var Logger = require('dw/system/Logger');

/* Script Modules */
var AdyenHelper = require('int_adyen/cartridge/scripts/util/AdyenHelper');
var THIS_SCRIPT = 'int_adyen/scripts/adyenCreateRecurringPayment.js';

function execute(args) {
    var result = createRecurringPayment(args);
    if (result.error) {
        return PIPELET_ERROR;
    }
    return PIPELET_NEXT;
}

function createRecurringPayment(args) {

    try {
        var requestObject = args.RequestObject;

        if (requestObject == null) {
            Logger.getLogger('Adyen').fatal(THIS_SCRIPT + ': No Request Object Present');
            return {error: true};
        }

        var callResult = null,
            resultObject = null,
            service = AdyenHelper.getService(AdyenHelper.SERVICE.SEND);

        if (service == null) {
            return {error: true};
        }

        args.Decision = '';
        args.PspReference = '';
        args.AdyenErrorMessage = '';

        service.addHeader('Content-type', 'application/json');
        service.addHeader('charset', 'UTF-8');
        callResult = service.call(JSON.stringify(requestObject));

        if (callResult.isOk() == false) {
            Logger.error(THIS_SCRIPT + ' Adyen: Call error code' +  callResult.getError().toString() + ' Error => ResponseStatus: ' + callResult.getStatus()  + ' | ResponseErrorText: ' +  callResult.getErrorMessage() + ' | ResponseText: ' + callResult.getMsg());
            args.AdyenErrorMessage = dw.web.Resource.msg('confirm.error.technical','checkout', null);
            return {
                error: true,
                args: args
            };
        }

        resultObject = ('object' in callResult ? callResult.object : null);

        var resultObj = {
            statusCode: resultObject.getStatusCode(),
            statusMessage: resultObject.getStatusMessage(),
            text: resultObject.getText(),
            errorText: resultObject.getErrorText(),
            timeout: resultObject.getTimeout()
        }

        var resultText = ('text' in resultObj && !empty(resultObj.text) ? resultObj.text : null);
        if (resultText == null) {
            return {error: true};
        }

        // build the response object
        var responseObj;
        try {
            responseObj = JSON.parse(resultText);
        } catch (ex) {
            Logger.error(THIS_SCRIPT + ' Adyen: error parsing response object ' + ex.message);
            return {error: true};
        }

        var pspReference = '',
            resultCode = '',
            errorMessage = '';

        pspReference = ('pspReference' in responseObj && !empty(responseObj.pspReference) ? responseObj.pspReference : '');
        resultCode = ('resultCode' in responseObj && !empty(responseObj.resultCode) ? responseObj.resultCode : '');

        if (resultCode.indexOf('Authorised') > -1) {
            args.Decision = 'ACCEPT';
            args.PspReference = pspReference;
        } else {
            args.Decision = 'ERROR';
            errorMessage = dw.web.Resource.msg('confirm.error.declined','checkout', null);
            if ('refusalReason' in responseObj && !empty(responseObj.refusalReason)) {
                errorMessage += ' (' + responseObj.refusalReason + ')';
            }
            args.AdyenErrorMessage = errorMessage;
        }
    } catch (e) {
        Logger.getLogger('Adyen').fatal('Adyen: ' + e.toString() + ' in ' + e.fileName + ':' + e.lineNumber);
        return {error: true};
    }

    return args;
}

module.exports = {
    'execute': execute,
    'createRecurringPayment': createRecurringPayment
}