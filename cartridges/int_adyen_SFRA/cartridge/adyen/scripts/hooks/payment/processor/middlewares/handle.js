"use strict";

var Transaction = require('dw/system/Transaction');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var collections = require('*/cartridge/scripts/util/collections');
var constants = require('*/cartridge/adyen/config/constants');
function removeAllPaymentInstruments(currentBasket) {
  collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
    currentBasket.removePaymentInstrument(item);
  });
}
function convertToSfccCardType(paymentInformation, paymentInstrument) {
  var _stateData$paymentMet;
  var stateData = JSON.parse(paymentInformation.stateData);
  var cardType = paymentInformation.cardType || (stateData === null || stateData === void 0 ? void 0 : (_stateData$paymentMet = stateData.paymentMethod) === null || _stateData$paymentMet === void 0 ? void 0 : _stateData$paymentMet.srcScheme);
  var sfccCardType = !paymentInformation.creditCardToken ? AdyenHelper.getSfccCardType(cardType) : paymentInformation.cardType;
  paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
  paymentInstrument.setCreditCardType(sfccCardType);
  paymentInstrument.custom.adyenPaymentMethod = sfccCardType;
  paymentInstrument.custom["".concat(constants.OMS_NAMESPACE, "__Adyen_Payment_Method")] = sfccCardType;
  if (paymentInformation.creditCardToken) {
    var firstTwoDigitsFromCurrentYear = AdyenHelper.getFirstTwoNumbersFromYear();
    var expirationYear = firstTwoDigitsFromCurrentYear * 100 + paymentInformation.expirationYear;
    paymentInstrument.setCreditCardExpirationMonth(paymentInformation.expirationMonth);
    paymentInstrument.setCreditCardExpirationYear(expirationYear);
    paymentInstrument.setCreditCardToken(paymentInformation.creditCardToken);
  }
}
function handle(basket, paymentInformation) {
  var currentBasket = basket;
  var cardErrors = {};
  var serverErrors = [];
  Transaction.wrap(function () {
    var _JSON$parse, _JSON$parse$paymentMe, _JSON$parse2, _JSON$parse2$paymentM;
    removeAllPaymentInstruments(currentBasket);
    var paymentInstrumentType = AdyenHelper.getPaymentInstrumentType(paymentInformation.isCreditCard);
    var paymentInstrument = currentBasket.createPaymentInstrument(paymentInstrumentType, currentBasket.totalGrossPrice);
    paymentInstrument.custom.adyenPaymentData = paymentInformation.stateData;
    paymentInstrument.custom.adyenMainPaymentInstrument = paymentInstrumentType;
    paymentInstrument.custom.adyenPaymentMethod = paymentInformation.adyenPaymentMethod;
    if (paymentInformation.partialPaymentsOrder) {
      paymentInstrument.custom.adyenPartialPaymentsOrder = session.privacy.partialPaymentData;
    }
    paymentInstrument.custom.Adyen_Payment_Method_Variant = paymentInformation.stateData ? (_JSON$parse = JSON.parse(paymentInformation.stateData)) === null || _JSON$parse === void 0 ? void 0 : (_JSON$parse$paymentMe = _JSON$parse.paymentMethod) === null || _JSON$parse$paymentMe === void 0 ? void 0 : _JSON$parse$paymentMe.type : null;
    paymentInstrument.custom["".concat(constants.OMS_NAMESPACE, "__Adyen_Payment_Method_Variant")] = paymentInformation.stateData ? (_JSON$parse2 = JSON.parse(paymentInformation.stateData)) === null || _JSON$parse2 === void 0 ? void 0 : (_JSON$parse2$paymentM = _JSON$parse2.paymentMethod) === null || _JSON$parse2$paymentM === void 0 ? void 0 : _JSON$parse2$paymentM.type : null;
    if (paymentInformation.isCreditCard) {
      // If the card wasn't a stored card we need to convert sfccCardType
      convertToSfccCardType(paymentInformation, paymentInstrument);
    } else {
      paymentInstrument.custom["".concat(constants.OMS_NAMESPACE, "__Adyen_Payment_Method")] = paymentInformation.adyenPaymentMethod;
    }
  });
  return {
    fieldErrors: cardErrors,
    serverErrors: serverErrors,
    error: false
  };
}
module.exports = handle;