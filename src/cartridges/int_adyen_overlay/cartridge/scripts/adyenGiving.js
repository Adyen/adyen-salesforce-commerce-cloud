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
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const constants = require('*/cartridge/adyenConstants/constants');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

function donate(donationReference, donationAmount, originalReference) {
  try {
    let paymentMethodVariant;
    const order = OrderMgr.getOrder(donationReference);
    const paymentInstrument = order.getPaymentInstruments(
      AdyenHelper.getOrderMainPaymentInstrumentType(order),
    )[0];
    const donationToken = paymentInstrument.paymentTransaction.custom.Adyen_donationToken;
    paymentMethodVariant = paymentInstrument.custom.Adyen_Payment_Method_Variant;

    // for iDeal donations, the payment method variant needs to be set to sepadirectdebit
    if (paymentMethodVariant === 'ideal') {
      paymentMethodVariant = 'sepadirectdebit';
    }
    const requestObject = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      donationAccount: AdyenConfigs.getAdyenGivingCharityAccount(),
      amount: donationAmount,
      reference: `${AdyenConfigs.getAdyenMerchantAccount()}-${donationReference}`,
      donationOriginalPspReference: originalReference,
      donationToken,
      paymentMethod: {
        type: paymentMethodVariant
      },
      shopperInteraction: constants.SHOPPER_INTERACTIONS.CONT_AUTH,
    };

    const platformVersion = AdyenHelper.getApplicationInfo().externalPlatform.version;
    const service = platformVersion === constants.PLATFORMS.SG ? `${constants.SERVICE.ADYENGIVING}${constants.PLATFORMS.SG}` : constants.SERVICE.PAYMENT;
    const response = AdyenHelper.executeCall(service, requestObject);

    Transaction.wrap(() => {
      const order = OrderMgr.getOrder(donationReference);
      order.custom.Adyen_donationAmount = JSON.stringify(donationAmount);
    });
    return response;
  } catch (e) {
    AdyenLogs.error_log(
      `Adyen: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
    );
  }
}

module.exports = {
  donate,
};
