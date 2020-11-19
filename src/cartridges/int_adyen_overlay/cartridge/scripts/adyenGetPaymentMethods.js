/**
* Send request to adyen to get payment methods based on country code and currency
*

* @input Basket : dw.order.Basket
* @input countryCode : String
* @output customer : Customer
*/

// script include
const Logger = require('dw/system/Logger');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function getMethods(basket, customer, countryCode) {
  try {
    const service = AdyenHelper.getService(
      AdyenHelper.SERVICE.CHECKOUTPAYMENTMETHODS,
    );
    if (!service) {
      throw new Error('Could not do /paymentMethods call');
    }

    let paymentAmount;
    let currencyCode;

    // paymentMethods call from checkout
    if (basket) {
      paymentAmount = basket.getTotalGrossPrice()
        ? AdyenHelper.getCurrencyValueForApi(basket.getTotalGrossPrice()).getValueOrNull()
        : 1000;
      currencyCode = basket.currencyCode;
    } else { // paymentMethods call from My Account
      paymentAmount = 1000;
      currencyCode = session.currency.currencyCode;
    }
    const paymentMethodsRequest = {
      merchantAccount: AdyenHelper.getAdyenMerchantAccount(),
      amount: {
        currency: currencyCode,
        value: paymentAmount,
      },
    };

    if (countryCode) {
      paymentMethodsRequest.countryCode = countryCode;
    }

    // check logged in shopper for oneClick
    const profile = customer && customer.registered && customer.getProfile()
      ? customer.getProfile()
      : null;
    let customerID = null;
    if (profile && profile.getCustomerNo()) {
      customerID = profile.getCustomerNo();
    }
    if (customerID) {
      paymentMethodsRequest.shopperReference = customerID;
    }

    const xapikey = AdyenHelper.getAdyenApiKey();
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-key', xapikey);

    const callResult = service.call(JSON.stringify(paymentMethodsRequest));
    if (!callResult.isOk()) {
      throw new Error(
        `/paymentMethods call error code${
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
      throw new Error('No correct response from /paymentMethods call');
    }

    return JSON.parse(resultObject.getText());
  } catch (e) {
    Logger.getLogger('Adyen').fatal(
      `Adyen: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
    );
  }
}

module.exports = {
  getMethods: getMethods,
};
