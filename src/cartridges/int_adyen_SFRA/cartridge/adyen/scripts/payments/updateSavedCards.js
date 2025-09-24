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
  const amount = new dw.value.Money(0, session.currency.currencyCode);
  const { storedPaymentMethods } = getPaymentMethods.getMethods(
    amount,
    customer,
    '',
  );
  return (
    storedPaymentMethods?.filter(
      (pm) =>
        pm.supportedShopperInteractions &&
        pm.supportedShopperInteractions.indexOf('Ecommerce') > -1,
    ) || []
  );
}

function removeSavedCards(customer) {
  const wallet = customer.getProfile().getWallet();
  // To make it compatible with upgrade from older versions (<= 19.2.2),
  // first delete payment instruments with METHOD_CREDIT_CARD
  const savedCreditCards = wallet.getPaymentInstruments(
    PaymentInstrument.METHOD_CREDIT_CARD,
  );
  const savedCreditCardsComponent = wallet.getPaymentInstruments(
    constants.METHOD_ADYEN_COMPONENT,
  );

  collections.forEach(savedCreditCards, (card) => {
    wallet.removePaymentInstrument(card);
  });
  collections.forEach(savedCreditCardsComponent, (card) => {
    wallet.removePaymentInstrument(card);
  });
}

function isValidCardDetails(cardDetails) {
  return !Object.values(cardDetails).some((value) => !value);
}

function createPaymentInstrumentFromDetails(wallet, cardDetails) {
  const newCreditCard = wallet.createPaymentInstrument(
    constants.METHOD_ADYEN_COMPONENT,
  );
  newCreditCard.setCreditCardExpirationMonth(Number(cardDetails.expiryMonth));
  newCreditCard.setCreditCardExpirationYear(Number(cardDetails.expiryYear));
  newCreditCard.setCreditCardType(cardDetails.cardType);
  newCreditCard.setCreditCardHolder(cardDetails.holderName);
  newCreditCard.setCreditCardNumber(cardDetails.number);
  newCreditCard.setCreditCardToken(cardDetails.token);
}

function createCardDetailsFromPayment(payment) {
  const {
    expiryMonth = '',
    expiryYear = '',
    holderName = '',
    lastFour = '',
    id: token,
    brand,
  } = payment;

  return {
    expiryMonth,
    expiryYear,
    holderName,
    number: lastFour ? `************${lastFour}` : '',
    token,
    cardType: brand ? AdyenHelper.getSfccCardType(brand) : '',
  };
}

function createSavedCard(wallet, payment) {
  const cardDetails = createCardDetailsFromPayment(payment);
  if (isValidCardDetails(cardDetails)) {
    createPaymentInstrumentFromDetails(wallet, cardDetails);
  }
}

function createSavedCards(customer, oneClickPaymentMethods) {
  const wallet = customer.getProfile().getWallet();
  oneClickPaymentMethods?.forEach((payment) => {
    createSavedCard(wallet, payment);
  });
}

function updateSavedCards(args) {
  const customer = args.CurrentCustomer;
  if (!customer?.getProfile()?.getWallet()) {
    throw new Error(
      'Error while updating saved cards, could not get customer data',
    );
  }

  if (AdyenConfigs.getAdyenRecurringPaymentsEnabled()) {
    const oneClickPaymentMethods = getOneClickPaymentMethods(customer);
    Transaction.wrap(() => {
      removeSavedCards(customer);
      createSavedCards(customer, oneClickPaymentMethods);
    });
  }
  return { error: false };
}

module.exports = {
  updateSavedCards,
};
