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
 * Make a donation to Adyen giving
 */

// script include
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var constants = require('*/cartridge/adyenConstants/constants');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
function donate(donationReference, donationAmount, originalReference) {
  try {
    var paymentMethodVariant;
    var order = OrderMgr.getOrder(donationReference);
    var paymentInstrument = order.getPaymentInstruments(AdyenHelper.getOrderMainPaymentInstrumentType(order))[0];
    var donationToken = paymentInstrument.paymentTransaction.custom.Adyen_donationToken;
    paymentMethodVariant = paymentInstrument.custom.Adyen_Payment_Method_Variant;

    // for iDeal donations, the payment method variant needs to be set to sepadirectdebit
    if (paymentMethodVariant === 'ideal') {
      paymentMethodVariant = 'sepadirectdebit';
    }
    var requestObject = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      donationAccount: AdyenConfigs.getAdyenGivingCharityAccount(),
      amount: donationAmount,
      reference: "".concat(AdyenConfigs.getAdyenMerchantAccount(), "-").concat(donationReference),
      donationOriginalPspReference: originalReference,
      donationToken: donationToken,
      paymentMethod: {
        type: paymentMethodVariant
      },
      shopperInteraction: constants.SHOPPER_INTERACTIONS.CONT_AUTH
    };
    var platformVersion = AdyenHelper.getApplicationInfo().externalPlatform.version;
    var service = platformVersion === constants.PLATFORMS.SG ? "".concat(constants.SERVICE.ADYENGIVING).concat(constants.PLATFORMS.SG) : constants.SERVICE.ADYENGIVING;
    var response = AdyenHelper.executeCall(service, requestObject);
    Transaction.wrap(function () {
      var order = OrderMgr.getOrder(donationReference);
      order.custom.Adyen_donationAmount = JSON.stringify(donationAmount);
    });
    return response;
  } catch (e) {
    AdyenLogs.error_log("Adyen: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
  }
}
module.exports = {
  donate: donate
};