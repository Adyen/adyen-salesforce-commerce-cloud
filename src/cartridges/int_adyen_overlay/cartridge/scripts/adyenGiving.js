/**
 * Send request to adyen to get connected terminals based on merchant account and storeId
 *
 */

// script include
const Logger = require('dw/system/Logger');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function donate(donationReference, donationAmount, originalReference) {
  try {
    const service = AdyenHelper.getService(AdyenHelper.SERVICE.ADYENGIVING);
    if (!service) {
      throw new Error('Could not connect to Adyen Giving');
    }

    const requestObject = {
      merchantAccount: AdyenHelper.getAdyenMerchantAccount(),
      donationAccount: AdyenHelper.getAdyenGivingCharityAccount(),
      modificationAmount: donationAmount,
      reference:
        `${AdyenHelper.getAdyenMerchantAccount()}-${donationReference}`,
      originalReference: originalReference,
    };

    const xapikey = AdyenHelper.getAdyenApiKey();
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-key', xapikey);
    const callResult = service.call(JSON.stringify(requestObject));

    if (!callResult.isOk()) {
      throw new Error(
        `Call error code${
          callResult.getError().toString()
        } Error => ResponseStatus: ${
          callResult.getStatus()
        } | ResponseErrorText: ${
          callResult.getErrorMessage()
        } | ResponseText: ${
          callResult.getMsg()}`,
      );
    }

    const resultObject = callResult.object;

    if (!resultObject || !resultObject.getText()) {
      throw new Error('No correct response from adyenGiving call');
    }

    Transaction.wrap(function () {
      const order = OrderMgr.getOrder(donationReference);
      order.custom.Adyen_donationAmount = JSON.stringify(donationAmount);
    });
    return JSON.parse(resultObject.getText());
  } catch (e) {
    Logger.getLogger('Adyen').error(
      `Adyen: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
    );
  }
}

module.exports = {
  donate: donate,
};
