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
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const constants = require('*/cartridge/adyen/config/constants');
const blockedPayments = require('*/cartridge/adyen/config/blockedPaymentMethods.json');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

// eslint-disable-next-line complexity
function getMethods(paymentAmount, customer, countryCode, shopperEmail) {
  try {
    const paymentMethodsRequest = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      amount: {
        currency: paymentAmount.currencyCode,
        value: paymentAmount.value,
      },
    };

    if (countryCode) {
      paymentMethodsRequest.countryCode = countryCode;
    }

    if (request.getLocale()) {
      paymentMethodsRequest.shopperLocale = request.getLocale();
    }

    if (shopperEmail) {
      paymentMethodsRequest.shopperEmail = shopperEmail;
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

    paymentMethodsRequest.shopperConversionId = session.sessionID.slice(0, 200);

    return AdyenHelper.executeCall(
      constants.SERVICE.CHECKOUTPAYMENTMETHODS,
      paymentMethodsRequest,
    );
  } catch (error) {
    AdyenLogs.fatal_log('/paymentMethods call failed', error);
    return { error: true };
  }
}

module.exports = {
  getMethods,
};
