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
 * Send request to adyen to get payment methods based on country code and currency
 */

// script include
const Logger = require('dw/system/Logger');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const constants = require('*/cartridge/adyenConstants/constants');

function getMethods(basket, customer, countryCode) {
  try {
    const service = AdyenHelper.getService(
        constants.SERVICE.CHECKOUTPAYMENTMETHODS,
    );
    if (!service) {
      throw new Error('Could not do /paymentMethods call');
    }

    let paymentAmount;
    let currencyCode;

    // paymentMethods call from checkout
    if (basket) {
      currencyCode = basket.currencyCode;
      paymentAmount = basket.getTotalGrossPrice().isAvailable()
        ? AdyenHelper.getCurrencyValueForApi(basket.getTotalGrossPrice())
        : new dw.value.Money(1000, currencyCode);
    } else {
      // paymentMethods call from My Account
      currencyCode = session.currency.currencyCode;
      paymentAmount = new dw.value.Money(0, currencyCode);
    }

    const paymentMethodsRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: {
        currency: currencyCode,
        value: paymentAmount.value,
      },
    };

    if (countryCode) {
      paymentMethodsRequest.countryCode = countryCode;
    }

    if(request.getLocale()){
      paymentMethodsRequest.shopperLocale = request.getLocale();
    }

    // check logged in shopper for oneClick
    const profile =
      customer && customer.registered && customer.getProfile()
        ? customer.getProfile()
        : null;
    let customerID = null;
    if (profile && profile.getCustomerNo()) {
      customerID = profile.getCustomerNo();
    }
    if (customerID) {
      paymentMethodsRequest.shopperReference = customerID;
    }

    paymentMethodsRequest.blockedPaymentMethods = AdyenHelper.BLOCKED_PAYMENT_METHODS;

    const xapikey = AdyenConfigs.getAdyenApiKey();
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-key', xapikey);

    const callResult = service.call(JSON.stringify(paymentMethodsRequest));
    if (!callResult.isOk()) {
      throw new Error(
        `/paymentMethods call error code${callResult
          .getError()
          .toString()} Error => ResponseStatus: ${callResult.getStatus()} | ResponseErrorText: ${callResult.getErrorMessage()} | ResponseText: ${callResult.getMsg()}`,
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
  getMethods,
};
