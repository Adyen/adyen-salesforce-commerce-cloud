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
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
var constants = require('*/cartridge/adyen/config/constants');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

// eslint-disable-next-line complexity
function donate(donationReference, donationAmount, orderToken) {
  try {
    var _paymentData$fullResp, _paymentData$fullResp2, _paymentData$paymentM, _paymentData$fullResp3, _paymentData$fullResp4;
    if (session.privacy.orderNo !== donationReference) {
      throw new Error('Donation reference is invalid');
    }
    var paymentMethodVariant;
    var order = OrderMgr.getOrder(donationReference, orderToken);
    var paymentInstrument = order.getPaymentInstruments(AdyenHelper.getOrderMainPaymentInstrumentType(order))[0];
    var donationToken = paymentInstrument.paymentTransaction.custom.Adyen_donationToken;
    var originalReference = paymentInstrument.paymentTransaction.custom.Adyen_pspReference;
    var paymentData = JSON.parse(paymentInstrument.paymentTransaction.custom.Adyen_log);
    var paymentCurrency = paymentData.amount.currency || ((_paymentData$fullResp = paymentData.fullResponse) === null || _paymentData$fullResp === void 0 ? void 0 : (_paymentData$fullResp2 = _paymentData$fullResp.amount) === null || _paymentData$fullResp2 === void 0 ? void 0 : _paymentData$fullResp2.currency);
    var availableDonationAmounts = AdyenHelper.getDonationAmounts();
    paymentMethodVariant = ((_paymentData$paymentM = paymentData.paymentMethod) === null || _paymentData$paymentM === void 0 ? void 0 : _paymentData$paymentM.type) || ((_paymentData$fullResp3 = paymentData.fullResponse) === null || _paymentData$fullResp3 === void 0 ? void 0 : (_paymentData$fullResp4 = _paymentData$fullResp3.paymentMethod) === null || _paymentData$fullResp4 === void 0 ? void 0 : _paymentData$fullResp4.type);

    // for iDeal donations, the payment method variant needs to be set to sepadirectdebit
    if (paymentMethodVariant === 'ideal') {
      paymentMethodVariant = 'sepadirectdebit';
    }
    // for Apple Pay donations, the payment method variant needs to be the brand
    if (paymentMethodVariant === 'applepay') {
      var _paymentData$paymentM2, _paymentData$fullResp5, _paymentData$fullResp6;
      paymentMethodVariant = ((_paymentData$paymentM2 = paymentData.paymentMethod) === null || _paymentData$paymentM2 === void 0 ? void 0 : _paymentData$paymentM2.brand) || ((_paymentData$fullResp5 = paymentData.fullResponse) === null || _paymentData$fullResp5 === void 0 ? void 0 : (_paymentData$fullResp6 = _paymentData$fullResp5.paymentMethod) === null || _paymentData$fullResp6 === void 0 ? void 0 : _paymentData$fullResp6.brand);
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
    if (availableDonationAmounts.indexOf(parseInt(donationAmount.value, 10)) === -1) {
      throw new Error('Donation amount is invalid');
    }
    if (paymentCurrency !== donationAmount.currency) {
      throw new Error('Donation currency is invalid');
    }
    var response = AdyenHelper.executeCall(constants.SERVICE.ADYENGIVING, requestObject);
    Transaction.wrap(function () {
      order.custom.Adyen_donationAmount = JSON.stringify(donationAmount);
      // Donation token is deleted in case the donation is completed once
      if (response.status === constants.DONATION_RESULT.COMPLETED) {
        paymentInstrument.paymentTransaction.custom.Adyen_donationToken = null;
      }
    });
    return response;
  } catch (error) {
    AdyenLogs.error_log('/donations call failed:', error);
    return {
      error: true
    };
  }
}
module.exports = {
  donate: donate
};