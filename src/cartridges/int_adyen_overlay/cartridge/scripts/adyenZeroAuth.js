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
 * Make a zeroAuth payment
 */

/* API Includes */
const URLUtils = require('dw/web/URLUtils');

/* Script Modules */
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

function zeroAuthPayment(customer, paymentInstrument) {
  try {

    let zeroAuthRequest = AdyenHelper.createAdyenRequestObject(
      null,
      paymentInstrument,
    );

    zeroAuthRequest = AdyenHelper.add3DS2Data(zeroAuthRequest);

    zeroAuthRequest.amount = {
      currency: session.currency.currencyCode,
      value: 0,
    };

    zeroAuthRequest.returnUrl = URLUtils.https('Adyen-Redirect3DS1Response').toString();

    zeroAuthRequest.storePaymentMethod = true;
    zeroAuthRequest.shopperReference = customer.getProfile().getCustomerNo();
    zeroAuthRequest.shopperEmail = customer.getProfile().getEmail();

    return adyenCheckout.doPaymentsCall(
      null,
      paymentInstrument,
      zeroAuthRequest,
    );
  } catch (e) {
    AdyenLogs.error_log(
      `error processing zero auth payment. Error message: ${
        e.message
      } more details: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
    );
    return { error: true };
  }
}

module.exports = {
  zeroAuthPayment,
};
