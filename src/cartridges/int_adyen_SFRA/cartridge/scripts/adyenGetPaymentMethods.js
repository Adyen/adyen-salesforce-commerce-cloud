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
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const constants = require('*/cartridge/adyenConstants/constants');
const blockedPayments = require('*/cartridge/scripts/config/blockedPaymentMethods.json');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

// eslint-disable-next-line complexity
function getMethods(basket, customer, countryCode) {
  try {
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

    if (request.getLocale()) {
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

    paymentMethodsRequest.blockedPaymentMethods =
      blockedPayments.blockedPaymentMethods;

    return AdyenHelper.executeCall(
      constants.SERVICE.CHECKOUTPAYMENTMETHODS,
      paymentMethodsRequest,
    );
  } catch (e) {
    AdyenLogs.fatal_log(
      `Adyen: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
    );
    return { error: true };
  }
}

module.exports = {
  getMethods,
};
