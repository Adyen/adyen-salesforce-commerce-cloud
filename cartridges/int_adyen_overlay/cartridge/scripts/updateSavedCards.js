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
 * Deletes expired payment instruments, syncs cards with Adyen recurring payments card list
 */

/* API Includes */
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Transaction = require('dw/system/Transaction');
var constants = require('*/cartridge/adyenConstants/constants');

/* Script Modules */
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
function updateSavedCards(args) {
  try {
    var customer = args.CurrentCustomer;
    if (!(customer && customer.getProfile() && customer.getProfile().getWallet())) {
      AdyenLogs.error_log('Error while updating saved cards, could not get customer data');
      return {
        error: true
      };
    }
    if (AdyenConfigs.getAdyenRecurringPaymentsEnabled()) {
      var oneClickPaymentMethods = getOneClickPaymentMethods(customer);
      // To make it compatible with upgrade from older versions (<= 19.2.2),
      // first delete payment instruments with METHOD_CREDIT_CARD
      var savedCreditCards = customer.getProfile().getWallet().getPaymentInstruments(PaymentInstrument.METHOD_CREDIT_CARD);
      var savedCreditCardsComponent = customer.getProfile().getWallet().getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);
      Transaction.wrap(function () {
        // remove all current METHOD_CREDIT_CARD PaymentInstruments
        for (var i = 0; i < savedCreditCards.length; i++) {
          var creditCard = savedCreditCards[i];
          customer.getProfile().getWallet().removePaymentInstrument(creditCard);
        }
        // remove all current METHOD_ADYEN_COMPONENT PaymentInstruments
        for (var _i = 0; _i < savedCreditCardsComponent.length; _i++) {
          var _creditCard = savedCreditCardsComponent[_i];
          customer.getProfile().getWallet().removePaymentInstrument(_creditCard);
        }

        // Create from existing cards a paymentInstrument
        for (var index = 0; index < oneClickPaymentMethods.length; index++) {
          var payment = oneClickPaymentMethods[index];
          var expiryMonth = payment.expiryMonth ? payment.expiryMonth : '';
          var expiryYear = payment.expiryYear ? payment.expiryYear : '';
          var holderName = payment.holderName ? payment.holderName : '';
          var lastFour = payment.lastFour ? payment.lastFour : '';
          var number = lastFour ? new Array(12 + 1).join('*') + lastFour : '';
          var token = payment.id;
          var cardType = payment.brand ? AdyenHelper.getSfccCardType(payment.brand) : '';

          // if we have everything we need, create a new payment instrument
          if (expiryMonth && expiryYear && number && token && cardType && holderName) {
            var newCreditCard = customer.getProfile().getWallet().createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT);
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
    return {
      error: false
    };
  } catch (ex) {
    AdyenLogs.error_log("".concat(ex.toString(), " in ").concat(ex.fileName, ":").concat(ex.lineNumber));
    return {
      error: true
    };
  }
}
function getOneClickPaymentMethods(customer) {
  var getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');
  var _getPaymentMethods$ge = getPaymentMethods.getMethods(null, customer, ''),
    storedPaymentMethods = _getPaymentMethods$ge.storedPaymentMethods;
  var oneClickPaymentMethods = [];
  if (storedPaymentMethods) {
    for (var i = 0; i < storedPaymentMethods.length; i++) {
      if (storedPaymentMethods[i].supportedShopperInteractions && storedPaymentMethods[i].supportedShopperInteractions.indexOf('Ecommerce') > -1) {
        oneClickPaymentMethods.push(storedPaymentMethods[i]);
      }
    }
  }
  return oneClickPaymentMethods;
}
module.exports = {
  updateSavedCards: updateSavedCards
};