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
 * Deletes expired payment instruments, syncs cards with Adyen recurring payments card list
 */

/* API Includes */
const PaymentInstrument = require('dw/order/PaymentInstrument');
const Transaction = require('dw/system/Transaction');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyen/config/constants');

/* Script Modules */
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const getPaymentMethods = require('*/cartridge/adyen/scripts/payments/adyenGetPaymentMethods');

function getOneClickPaymentMethods(customer) {
  const { storedPaymentMethods } = getPaymentMethods.getMethods(
    null,
    customer,
    '',
  );
  const oneClickPaymentMethods = [];
  if (storedPaymentMethods) {
    storedPaymentMethods?.forEach((storedPaymentMethod) => {
      if (
        storedPaymentMethod?.supportedShopperInteractions &&
        storedPaymentMethod?.supportedShopperInteractions.indexOf('Ecommerce') >
          -1
      ) {
        oneClickPaymentMethods.push(storedPaymentMethod);
      }
    });
  }
  return oneClickPaymentMethods;
}

/* eslint-disable */
function updateSavedCards(args) {
    const customer = args.CurrentCustomer;
    if (
      !(customer?.getProfile()?.getWallet())
    ) {
	  throw new Error('Error while updating saved cards, could not get customer data');
    }

    if (AdyenConfigs.getAdyenRecurringPaymentsEnabled()) {
      const oneClickPaymentMethods = getOneClickPaymentMethods(customer);
      // To make it compatible with upgrade from older versions (<= 19.2.2),
      // first delete payment instruments with METHOD_CREDIT_CARD
      const savedCreditCards = customer
        .getProfile()
        .getWallet()
        .getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
      const savedCreditCardsComponent = customer
        .getProfile()
        .getWallet()
        .getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);

      Transaction.wrap(() => {
        // remove all current METHOD_CREDIT_CARD PaymentInstruments
        collections.forEach(savedCreditCards, (savedCreditCard) => {
          customer.getProfile().getWallet().removePaymentInstrument(savedCreditCard);
        })
        // remove all current METHOD_ADYEN_COMPONENT PaymentInstruments
        collections.forEach(savedCreditCardsComponent, (savedCreditCard) => {
          customer.getProfile().getWallet().removePaymentInstrument(savedCreditCard);
        })

        // Create from existing cards a paymentInstrument
        oneClickPaymentMethods?.forEach((payment) => {
          const expiryMonth = payment.expiryMonth ? payment.expiryMonth : '';
          const expiryYear = payment.expiryYear ? payment.expiryYear : '';
          const holderName = payment.holderName ? payment.holderName : '';
          const lastFour = payment.lastFour ? payment.lastFour : '';
          const number = lastFour ? new Array(12 + 1).join('*') + lastFour : '';
          const token = payment.id;
          const cardType = payment.brand
            ? AdyenHelper.getSfccCardType(payment.brand)
            : '';

          // if we have everything we need, create a new payment instrument
          if (
            expiryMonth &&
            expiryYear &&
            number &&
            token &&
            cardType &&
            holderName
          ) {
            const newCreditCard = customer
              .getProfile()
              .getWallet()
              .createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT);
            newCreditCard.setCreditCardExpirationMonth(Number(expiryMonth));
            newCreditCard.setCreditCardExpirationYear(Number(expiryYear));
            newCreditCard.setCreditCardType(cardType);
            newCreditCard.setCreditCardHolder(holderName);
            newCreditCard.setCreditCardNumber(number);
            newCreditCard.setCreditCardToken(token);
          }
        })
      });
    }
    return { error: false };
}

module.exports = {
  updateSavedCards,
};
