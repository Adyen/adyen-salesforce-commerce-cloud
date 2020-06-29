/**
 * Send request to adyen to get connected terminals based on merchant account and storeId
 *
 */

//script include
var AdyenHelper = require("*/cartridge/scripts/util/AdyenHelper");
var Logger = require("dw/system/Logger");
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');

function donate (donationReference, donationAmount, originalReference) {
    try {
        var service = AdyenHelper.getService(AdyenHelper.SERVICE.ADYENGIVING);
        if (!service) {
            throw new Error("Could not connect to Adyen Giving")
        }

        var requestObject = {
            merchantAccount: AdyenHelper.getAdyenMerchantAccount(),
            donationAccount: AdyenHelper.getAdyenGivingCharityAccount(),
            modificationAmount: donationAmount,
            reference: AdyenHelper.getAdyenMerchantAccount() + "-" + donationReference,
            originalReference: originalReference
        };

        var xapikey = AdyenHelper.getAdyenApiKey();
        service.addHeader("Content-type", "application/json");
        service.addHeader("charset", "UTF-8");
        service.addHeader("X-API-key", xapikey);
        var callResult = service.call(JSON.stringify(requestObject));

        if (!callResult.isOk()) {
            throw new Error("Call error code" +  callResult.getError().toString() + " Error => ResponseStatus: " + callResult.getStatus()  + " | ResponseErrorText: " +  callResult.getErrorMessage() + " | ResponseText: " + callResult.getMsg());
        }

        var resultObject = callResult.object;

        if (!resultObject || !resultObject.getText()) {
            throw new Error("No correct response from adyenGiving call")
        }

        Transaction.wrap(function() {
            var order = OrderMgr.getOrder(donationReference);
            order.custom.Adyen_donationAmount = JSON.stringify(donationAmount);
        });
        return JSON.parse(resultObject.getText());

    } catch (e) {
        Logger.getLogger("Adyen").error("Adyen: " + e.toString() + " in " + e.fileName + ":" + e.lineNumber);
        return;
    }
}

module.exports = {
    'donate': donate
}