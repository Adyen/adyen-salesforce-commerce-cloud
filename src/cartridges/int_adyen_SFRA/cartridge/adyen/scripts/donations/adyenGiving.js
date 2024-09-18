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
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const constants = require('*/cartridge/adyen/config/constants');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

// eslint-disable-next-line complexity
function donate(donationReference, donationAmount, orderToken) {
  try {
    if (session.privacy.orderNo !== donationReference) {
      throw new Error('Donation reference is invalid');
    }

    let paymentMethodVariant;
    const order = OrderMgr.getOrder(donationReference, orderToken);
    const paymentInstrument = order.getPaymentInstruments(
      AdyenHelper.getOrderMainPaymentInstrumentType(order),
    )[0];
    const donationToken =
      paymentInstrument.paymentTransaction.custom.Adyen_donationToken;
    const originalReference =
      paymentInstrument.paymentTransaction.custom.Adyen_pspReference;
    const paymentData = JSON.parse(
      paymentInstrument.paymentTransaction.custom.Adyen_log,
    );
    const paymentCurrency =
      paymentData.amount.currency || paymentData.fullResponse?.amount?.currency;
    const availableDonationAmounts = AdyenHelper.getDonationAmounts();
    paymentMethodVariant =
      paymentData.paymentMethod?.type ||
      paymentData.fullResponse?.paymentMethod?.type;

    // for iDeal donations, the payment method variant needs to be set to sepadirectdebit
    if (paymentMethodVariant === 'ideal') {
      paymentMethodVariant = 'sepadirectdebit';
    }
    // for Apple Pay donations, the payment method variant needs to be the brand
    if (paymentMethodVariant === 'applepay') {
      paymentMethodVariant =
        paymentData.paymentMethod?.brand ||
        paymentData.fullResponse?.paymentMethod?.brand;
    }
    const requestObject = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      donationAccount: AdyenConfigs.getAdyenGivingCharityAccount(),
      amount: donationAmount,
      reference: `${AdyenConfigs.getAdyenMerchantAccount()}-${donationReference}`,
      donationOriginalPspReference: originalReference,
      donationToken,
      paymentMethod: {
        type: paymentMethodVariant,
      },
      shopperInteraction: constants.SHOPPER_INTERACTIONS.CONT_AUTH,
    };

    if (
      availableDonationAmounts.indexOf(parseInt(donationAmount.value, 10)) ===
      -1
    ) {
      throw new Error('Donation amount is invalid');
    }

    if (paymentCurrency !== donationAmount.currency) {
      throw new Error('Donation currency is invalid');
    }

    const response = AdyenHelper.executeCall(
      constants.SERVICE.ADYENGIVING,
      requestObject,
    );

    Transaction.wrap(() => {
      order.custom.Adyen_donationAmount = JSON.stringify(donationAmount);
      // Donation token is deleted in case the donation is completed once
      if (response.status === constants.DONATION_RESULT.COMPLETED) {
        paymentInstrument.paymentTransaction.custom.Adyen_donationToken = null;
      }
    });
    return response;
  } catch (error) {
    AdyenLogs.error_log('/donations call failed:', error);
    return { error: true };
  }
}

module.exports = {
  donate,
};
