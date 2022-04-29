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
 * Send request to adyen to get payment methods based on country code and currency
 */
// script include
var Logger = require('dw/system/Logger');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

var constants = require('*/cartridge/adyenConstants/constants');

function getMethods(basket, customer, countryCode) {
  try {
    var service = AdyenHelper.getService(constants.SERVICE.CHECKOUTPAYMENTMETHODS);

    if (!service) {
      throw new Error('Could not do /paymentMethods call');
    }

    var paymentAmount;
    var currencyCode; // paymentMethods call from checkout

    if (basket) {
      currencyCode = basket.currencyCode;
      paymentAmount = basket.getTotalGrossPrice().isAvailable() ? AdyenHelper.getCurrencyValueForApi(basket.getTotalGrossPrice()) : new dw.value.Money(1000, currencyCode);
    } else {
      // paymentMethods call from My Account
      currencyCode = session.currency.currencyCode;
      paymentAmount = new dw.value.Money(0, currencyCode);
    }

    var paymentMethodsRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: {
        currency: currencyCode,
        value: paymentAmount.value
      }
    };

    if (countryCode) {
      paymentMethodsRequest.countryCode = countryCode;
    }

    if (request.getLocale()) {
      paymentMethodsRequest.shopperLocale = request.getLocale();
    } // check logged in shopper for oneClick


    var profile = customer && customer.registered && customer.getProfile() ? customer.getProfile() : null;
    var customerID = null;

    if (profile && profile.getCustomerNo()) {
      customerID = profile.getCustomerNo();
    }

    if (customerID) {
      paymentMethodsRequest.shopperReference = customerID;
    }

    paymentMethodsRequest.blockedPaymentMethods = AdyenHelper.BLOCKED_PAYMENT_METHODS;
    var xapikey = AdyenConfigs.getAdyenApiKey();
    service.addHeader('Content-type', 'application/json');
    service.addHeader('charset', 'UTF-8');
    service.addHeader('X-API-key', xapikey);
    var callResult = service.call(JSON.stringify(paymentMethodsRequest));

    if (!callResult.isOk()) {
      throw new Error("/paymentMethods call error code".concat(callResult.getError().toString(), " Error => ResponseStatus: ").concat(callResult.getStatus(), " | ResponseErrorText: ").concat(callResult.getErrorMessage(), " | ResponseText: ").concat(callResult.getMsg()));
    }

    var resultObject = callResult.object;

    if (!resultObject || !resultObject.getText()) {
      throw new Error('No correct response from /paymentMethods call');
    }

    return JSON.parse(resultObject.getText());
  } catch (e) {
    Logger.getLogger('Adyen').fatal("Adyen: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
  }
}

module.exports = {
  getMethods: getMethods
};