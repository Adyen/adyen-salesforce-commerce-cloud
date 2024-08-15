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
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var constants = require('*/cartridge/adyen/config/constants');
function zeroAuthPayment(customer, paymentInstrument) {
  try {
    var zeroAuthRequest = AdyenHelper.createAdyenRequestObject('recurringPayment-account', 'recurringPayment-token', paymentInstrument, customer.getProfile().email);
    zeroAuthRequest = AdyenHelper.add3DS2Data(zeroAuthRequest);
    zeroAuthRequest.amount = {
      currency: session.currency.currencyCode,
      value: 0
    };
    zeroAuthRequest.returnUrl = URLUtils.https('Adyen-Redirect3DS1Response').toString();
    zeroAuthRequest.storePaymentMethod = true;
    zeroAuthRequest.recurringProcessingModel = constants.RECURRING_PROCESSING_MODEL.CARD_ON_FILE;
    zeroAuthRequest.shopperReference = customer.getProfile().getCustomerNo();
    zeroAuthRequest.shopperEmail = customer.getProfile().getEmail();
    zeroAuthRequest.shopperIP = request.getHttpRemoteAddress();
    return adyenCheckout.doPaymentsCall(null, paymentInstrument, zeroAuthRequest);
  } catch (e) {
    AdyenLogs.error_log("error processing zero auth payment. Error message: ".concat(e.message, " more details: ").concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    return {
      error: true
    };
  }
}
module.exports = {
  zeroAuthPayment: zeroAuthPayment
};