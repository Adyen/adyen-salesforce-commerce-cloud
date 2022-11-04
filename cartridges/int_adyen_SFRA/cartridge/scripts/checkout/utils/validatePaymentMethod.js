"use strict";

var PaymentInstrument = require('dw/order/PaymentInstrument');
var PaymentMgr = require('dw/order/PaymentMgr');
function validatePaymentMethod(applicablePaymentCards, applicablePaymentMethods) {
  return function (paymentInstrument) {
    var isValidPaymentMethod = function isValidPaymentMethod() {
      var isCard = PaymentInstrument.METHOD_CREDIT_CARD.equals(paymentInstrument.paymentMethod);
      var card = PaymentMgr.getPaymentCard(paymentInstrument.creditCardType);
      var isValidCard = card && applicablePaymentCards.contains(card) || paymentInstrument.getCreditCardToken();
      // Checks whether payment card is still applicable or if there is a credit card token set.
      return !isCard || isValidCard;
    };
    var paymentMethod = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod());
    if (paymentMethod && applicablePaymentMethods.contains(paymentMethod)) {
      return isValidPaymentMethod();
    }
    var isGiftCertificate = PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(paymentInstrument.paymentMethod);
    return isGiftCertificate;
  };
}
module.exports = validatePaymentMethod;