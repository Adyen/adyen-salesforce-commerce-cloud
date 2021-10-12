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
      // If the card wasn't a stored card we need to convert sfccCardType
      var sfccCardType = !paymentInformation.creditCardToken ? AdyenHelper.getSFCCCardType(paymentInformation.cardType) : paymentInformation.cardType;
      paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
      paymentInstrument.setCreditCardType(sfccCardType);
      paymentInstrument.custom.adyenPaymentMethod = sfccCardType;

      if (paymentInformation.creditCardToken) {
        paymentInstrument.setCreditCardExpirationMonth(paymentInformation.expirationMonth);
        paymentInstrument.setCreditCardExpirationYear(paymentInformation.expirationYear);
        paymentInstrument.setCreditCardToken(paymentInformation.creditCardToken);
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