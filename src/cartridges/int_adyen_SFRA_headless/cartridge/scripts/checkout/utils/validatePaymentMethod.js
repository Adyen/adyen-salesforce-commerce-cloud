const PaymentInstrument = require('dw/order/PaymentInstrument');
const PaymentMgr = require('dw/order/PaymentMgr');

function validatePaymentMethod(
  applicablePaymentCards,
  applicablePaymentMethods,
) {
  return (paymentInstrument) => {
    const isValidPaymentMethod = () => {
      const isCard = PaymentInstrument.METHOD_CREDIT_CARD.equals(
        paymentInstrument.paymentMethod,
      );

      const card = PaymentMgr.getPaymentCard(paymentInstrument.creditCardType);
      const isValidCard =
        (card && applicablePaymentCards.contains(card)) ||
        paymentInstrument.getCreditCardToken();
      // Checks whether payment card is still applicable or if there is a credit card token set.
      return !isCard || isValidCard;
    };

    const paymentMethod = PaymentMgr.getPaymentMethod(
      paymentInstrument.getPaymentMethod(),
    );
    if (paymentMethod && applicablePaymentMethods.contains(paymentMethod)) {
      return isValidPaymentMethod();
    }

    const isGiftCertificate = PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(
      paymentInstrument.paymentMethod,
    );

    return isGiftCertificate;
  };
}

module.exports = validatePaymentMethod;
