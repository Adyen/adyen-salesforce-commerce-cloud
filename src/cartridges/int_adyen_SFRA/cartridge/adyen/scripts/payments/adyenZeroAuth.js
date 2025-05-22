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
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const constants = require('*/cartridge/adyen/config/constants');

function zeroAuthPayment(customer, paymentInstrument) {
  let zeroAuthRequest = AdyenHelper.createAdyenRequestObject(
    'recurringPayment-account',
    'recurringPayment-token',
    paymentInstrument,
    customer.getProfile().email,
  );

  zeroAuthRequest = AdyenHelper.add3DS2Data(zeroAuthRequest);

  zeroAuthRequest.amount = {
    currency: session.currency.currencyCode,
    value: 0,
  };

  zeroAuthRequest.returnUrl = URLUtils.https(
    'Adyen-Redirect3DS1Response',
  ).toString();

  zeroAuthRequest.storePaymentMethod = true;
  zeroAuthRequest.recurringProcessingModel =
    constants.RECURRING_PROCESSING_MODEL.CARD_ON_FILE;
  zeroAuthRequest.shopperReference = customer.getProfile().getCustomerNo();
  zeroAuthRequest.shopperEmail = customer.getProfile().getEmail();
  zeroAuthRequest.shopperIP = request.getHttpRemoteAddress();

  return AdyenHelper.executeCall(constants.SERVICE.PAYMENT, zeroAuthRequest);
}

module.exports = {
  zeroAuthPayment,
};
