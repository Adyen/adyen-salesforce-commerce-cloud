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
const Transaction = require('dw/system/Transaction');
// script includes
const PaymentMgr = require('dw/order/PaymentMgr');
const Money = require('dw/value/Money');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const constants = require('*/cartridge/adyen/config/constants');

const giftCardsHelper = {
  createGiftCardPaymentInstrument(parsedGiftCardObj, divideBy, order) {
    let paymentInstrument;
    const paidGiftCardAmount = {
      value: parsedGiftCardObj.giftCard.amount.value,
      currency: parsedGiftCardObj.giftCard.amount.currency,
    };
    const paidGiftCardAmountFormatted = new Money(
      paidGiftCardAmount.value,
      paidGiftCardAmount.currency,
    ).divide(divideBy);
    Transaction.wrap(() => {
      paymentInstrument = order.createPaymentInstrument(
        constants.METHOD_ADYEN_COMPONENT,
        paidGiftCardAmountFormatted,
      );
      const { paymentProcessor } = PaymentMgr.getPaymentMethod(
        paymentInstrument.paymentMethod,
      );
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
      paymentInstrument.paymentTransaction.transactionID =
        parsedGiftCardObj.giftCard.pspReference;
      paymentInstrument.custom.adyenPaymentMethod =
        parsedGiftCardObj.giftCard.name;
      paymentInstrument.custom[
        `${constants.OMS_NAMESPACE}__Adyen_Payment_Method`
      ] = parsedGiftCardObj.giftCard.name;
      paymentInstrument.custom.Adyen_Payment_Method_Variant =
        parsedGiftCardObj.giftCard.brand;
      paymentInstrument.custom[
        `${constants.OMS_NAMESPACE}__Adyen_Payment_Method_Variant`
      ] = parsedGiftCardObj.giftCard.brand;
      paymentInstrument.paymentTransaction.custom.Adyen_log =
        JSON.stringify(parsedGiftCardObj);
      paymentInstrument.paymentTransaction.custom.Adyen_pspReference =
        parsedGiftCardObj.giftCard.pspReference;
    });
    AdyenHelper.setPaymentTransactionType(
      paymentInstrument,
      parsedGiftCardObj.giftCard,
    );
  },
};

module.exports = giftCardsHelper;
