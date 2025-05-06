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

function getActiveCampaigns() {
  try {
    // This will be fixed on API level, replace needs to be removed once fixed
    const currentLocale = request.getLocale().replace('_', '-');
    const requestObject = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      currency: session.currency.currencyCode,
      locale: currentLocale,
    };
    const response = AdyenHelper.executeCall(
      constants.SERVICE.ADYENDONATIONCAMPAIGNS,
      requestObject,
    );
    return response;
  } catch (error) {
    AdyenLogs.error_log('/donationCampaigns call failed:', error);
    return { error: true };
  }
}

// eslint-disable-next-line complexity
function donate(donationReference, donationAmount, orderToken) {
  try {
    if (session.privacy.orderNo !== donationReference) {
      throw new Error('Donation reference is invalid');
    }

    let paymentMethodVariant;
    const order = OrderMgr.getOrder(donationReference, orderToken);
    const orderAmount = AdyenHelper.getCurrencyValueForApi(
      order.getTotalGrossPrice(),
    );
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
    paymentMethodVariant =
      paymentData.paymentMethod?.type ||
      paymentData.fullResponse?.paymentMethod?.type;

    const donationCampaign = getActiveCampaigns().donationCampaigns[0];
    const donationCampaignId = donationCampaign.id;
    const donationCampaignType = donationCampaign.donation?.type;

    // for iDeal donations, the payment method variant needs to be set to sepadirectdebit
    if (paymentMethodVariant === constants.PAYMENTMETHODS.IDEAL) {
      paymentMethodVariant = constants.PAYMENTMETHODS.SEPADIRECTDEBIT;
    }
    // for Apple Pay donations, the payment method variant needs to be the brand
    if (
      [
        constants.PAYMENTMETHODS.APPLEPAY,
        constants.PAYMENTMETHODS.GOOGLEPAY,
        constants.PAYMENTMETHODS.PAYWITHGOOGLE,
      ].includes(paymentMethodVariant)
    ) {
      paymentMethodVariant = constants.PAYMENTMETHODS.SCHEME;
    }
    const requestObject = {
      merchantAccount: AdyenConfigs.getAdyenMerchantAccount(),
      donationCampaignId,
      amount: donationAmount,
      reference: `${AdyenConfigs.getAdyenMerchantAccount()}-${donationReference}`,
      donationOriginalPspReference: originalReference,
      donationToken,
      paymentMethod: {
        type: paymentMethodVariant,
      },
    };

    if (donationCampaignType === 'roundup') {
      const { maxRoundupAmount } = donationCampaign.donation;
      const roundUpAmount = maxRoundupAmount - (orderAmount % maxRoundupAmount);
      if (roundUpAmount !== parseInt(donationAmount.value, 10)) {
        throw new Error('Donation amount does not match the roundup amount');
      }
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
  getActiveCampaigns,
  donate,
};
