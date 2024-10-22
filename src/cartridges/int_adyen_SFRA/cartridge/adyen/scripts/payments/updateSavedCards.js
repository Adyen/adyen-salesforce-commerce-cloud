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
const constants = require('*/cartridge/adyen/config/constants');

/* Script Modules */
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const getPaymentMethods = require('*/cartridge/adyen/scripts/payments/adyenGetPaymentMethods');

function getOneClickPaymentMethods(customer) {
  const amount = new dw.value.Money(0, session.currency.currencyCode);
  const { storedPaymentMethods } = getPaymentMethods.getMethods(
    amount,
    customer,
    '',
  );
  const oneClickPaymentMethods = [];
  if (storedPaymentMethods) {
    for (let i = 0; i < storedPaymentMethods.length; i++) {
      if (
        storedPaymentMethods[i].supportedShopperInteractions &&
        storedPaymentMethods[i].supportedShopperInteractions.indexOf(
          'Ecommerce',
        ) > -1
      ) {
        oneClickPaymentMethods.push(storedPaymentMethods[i]);
      }
    }
  }
  return oneClickPaymentMethods;
}

/* eslint-disable */
function updateSavedCards(args) {
  try {
    const customer = args.CurrentCustomer;
    if (
      !(customer && customer.getProfile() && customer.getProfile().getWallet())
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
        for (let i = 0; i < savedCreditCards.length; i++) {
          const creditCard = savedCreditCards[i];
          customer.getProfile().getWallet().removePaymentInstrument(creditCard);
        }
        // remove all current METHOD_ADYEN_COMPONENT PaymentInstruments
        for (let i = 0; i < savedCreditCardsComponent.length; i++) {
          const creditCard = savedCreditCardsComponent[i];
          customer.getProfile().getWallet().removePaymentInstrument(creditCard);
        }

        // Create from existing cards a paymentInstrument
        for (let index = 0; index < oneClickPaymentMethods.length; index++) {
          const payment = oneClickPaymentMethods[index];
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
        }
      });
    }
    return { error: false };
  } catch (error) {
    AdyenLogs.error_log('Error while updating saved cards:', error);
    return { error: true };
  }
}

module.exports = {
  updateSavedCards,
};
