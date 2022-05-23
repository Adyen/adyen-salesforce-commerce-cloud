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
 * Make a zeroAuth payment
 */

/* API Includes */
var URLUtils = require('dw/web/URLUtils');
/* Script Modules */


var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

var Logger = require('dw/system/Logger');

function zeroAuthPayment(customer, paymentInstrument) {
  try {
    var zeroAuthRequest = AdyenHelper.createAdyenRequestObject(null, paymentInstrument);

    if (AdyenConfigs.getAdyen3DS2Enabled()) {
      zeroAuthRequest = AdyenHelper.add3DS2Data(zeroAuthRequest);
    }

    zeroAuthRequest.amount = {
      currency: session.currency.currencyCode,
      value: 0
    };
    zeroAuthRequest.returnUrl = URLUtils.https('Adyen-Redirect3DS1Response').toString();
    zeroAuthRequest.storePaymentMethod = true;
    zeroAuthRequest.shopperReference = customer.getProfile().getCustomerNo();
    zeroAuthRequest.shopperEmail = customer.getProfile().getEmail();
    return adyenCheckout.doPaymentsCall(null, paymentInstrument, zeroAuthRequest);
  } catch (e) {
    Logger.getLogger('Adyen').error("error processing zero auth payment. Error message: ".concat(e.message, " more details: ").concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    return {
      error: true
    };
  }
}

module.exports = {
  zeroAuthPayment: zeroAuthPayment
};