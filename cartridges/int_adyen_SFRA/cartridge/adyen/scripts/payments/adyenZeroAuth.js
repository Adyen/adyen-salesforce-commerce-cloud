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
var Resource = require('dw/web/Resource');

/* Script Modules */
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
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
    return AdyenHelper.executeCall(constants.SERVICE.PAYMENT, zeroAuthRequest);
  } catch (error) {
    AdyenLogs.error_log('error processing zero auth payment:', error);
    return {
      error: true,
      args: {
        adyenErrorMessage: Resource.msg('confirm.error.declined', 'checkout', null)
      }
    };
  }
}
module.exports = {
  zeroAuthPayment: zeroAuthPayment
};