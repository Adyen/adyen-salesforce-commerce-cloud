"use strict";

var Transaction = require('dw/system/Transaction');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var collections = require('*/cartridge/scripts/util/collections');

var constants = require('*/cartridge/adyenConstants/constants');

function handle(basket, paymentInformation) {
  var currentBasket = basket;
  var cardErrors = {};
  var serverErrors = [];
  Transaction.wrap(function () {
    collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
      currentBasket.removePaymentInstrument(item);
    });
    var paymentInstrument = currentBasket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, currentBasket.totalGrossPrice);
    paymentInstrument.custom.adyenPaymentData = paymentInformation.stateData;
    paymentInstrument.custom.adyenPaymentMethod = paymentInformation.adyenPaymentMethod;

    if (paymentInformation.isCreditCard) {
      var sfccCardType = AdyenHelper.getSFCCCardType(paymentInformation.cardType);
      var tokenID = AdyenHelper.getCardToken(paymentInformation.storedPaymentUUID, customer);
      paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
      paymentInstrument.setCreditCardType(sfccCardType);

      if (tokenID) {
        paymentInstrument.setCreditCardExpirationMonth(paymentInformation.expirationMonth.value);
        paymentInstrument.setCreditCardExpirationYear(paymentInformation.expirationYear.value);
        paymentInstrument.setCreditCardToken(tokenID);
      }
    }
  });
  return {
    fieldErrors: cardErrors,
    serverErrors: serverErrors,
    error: false
  };
}

module.exports = handle; // export default Handle;