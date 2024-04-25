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
 * Copyright (c) 2022 Adyen B.V.
 * This file is open source and available under the MIT license.
 * See the LICENSE file for more info.
 */
var Transaction = require('dw/system/Transaction');
// script includes
var PaymentMgr = require('dw/order/PaymentMgr');
var Money = require('dw/value/Money');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var constants = require('*/cartridge/adyen/config/constants');
var giftCardsHelper = {
  createGiftCardPaymentInstrument: function createGiftCardPaymentInstrument(parsedGiftCardObj, divideBy, order) {
    var paymentInstrument;
    var paidGiftCardAmount = {
      value: parsedGiftCardObj.giftCard.amount.value,
      currency: parsedGiftCardObj.giftCard.amount.currency
    };
    var paidGiftCardAmountFormatted = new Money(paidGiftCardAmount.value, paidGiftCardAmount.currency).divide(divideBy);
    Transaction.wrap(function () {
      paymentInstrument = order.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, paidGiftCardAmountFormatted);
      var _PaymentMgr$getPaymen = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod),
        paymentProcessor = _PaymentMgr$getPaymen.paymentProcessor;
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
      paymentInstrument.paymentTransaction.transactionID = parsedGiftCardObj.giftCard.pspReference;
      paymentInstrument.custom.adyenPaymentMethod = parsedGiftCardObj.giftCard.name;
      paymentInstrument.custom["".concat(constants.OMS_NAMESPACE, "__Adyen_Payment_Method")] = parsedGiftCardObj.giftCard.name;
      paymentInstrument.custom.Adyen_Payment_Method_Variant = parsedGiftCardObj.giftCard.brand;
      paymentInstrument.custom["".concat(constants.OMS_NAMESPACE, "__Adyen_Payment_Method_Variant")] = parsedGiftCardObj.giftCard.brand;
      paymentInstrument.paymentTransaction.custom.Adyen_log = JSON.stringify(parsedGiftCardObj);
      paymentInstrument.paymentTransaction.custom.Adyen_pspReference = parsedGiftCardObj.giftCard.pspReference;
    });
    AdyenHelper.setPaymentTransactionType(paymentInstrument, parsedGiftCardObj.giftCard);
  }
};
module.exports = giftCardsHelper;