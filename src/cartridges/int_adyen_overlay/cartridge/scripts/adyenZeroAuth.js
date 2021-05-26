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
const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');

/* Script Modules */
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

function zeroAuthPayment(customer, paymentInstrument) {
  try {

    let zeroAuthRequest = AdyenHelper.createAdyenRequestObject(
      null,
      paymentInstrument,
    );

    zeroAuthRequest.amount = {
      currency: session.currency.currencyCode,
      value: 0,
    };

    zeroAuthRequest.returnUrl = URLUtils.https('PaymentInstruments-AddPayment').toString();

    // StorepaymentMethod overrides enableReccuring/enableOneClick. Either one is allowed, not all.
    zeroAuthRequest.storePaymentMethod = true;
    delete zeroAuthRequest.enableRecurring;
    delete zeroAuthRequest.enableOneClick;

    zeroAuthRequest.shopperReference = customer.getProfile().getCustomerNo();
    zeroAuthRequest.shopperEmail = customer.getProfile().getEmail();

    return adyenCheckout.doPaymentCall(
      null,
      paymentInstrument,
      zeroAuthRequest,
    );
  } catch (e) {
    Logger.getLogger('Adyen').error(
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
