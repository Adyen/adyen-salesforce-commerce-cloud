const PaymentMgr = require('dw/order/PaymentMgr');
const PaymentInstrument = require('dw/order/PaymentInstrument');

/**
 * Validates payment
 * @param {Object} req - The local instance of the request object
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an object that has error information
 */
function validatePayment(req, currentBasket) {
  let applicablePaymentCards;
  let applicablePaymentMethods;
  const creditCardPaymentMethod = PaymentMgr.getPaymentMethod(
    PaymentInstrument.METHOD_CREDIT_CARD,
  );
  const paymentAmount = currentBasket.totalGrossPrice.value;
  const { countryCode } = req.geolocation;
  const currentCustomer = req.currentCustomer.raw;
  const { paymentInstruments } = currentBasket;
  const result = {};

  applicablePaymentMethods = PaymentMgr.getApplicablePaymentMethods(
    currentCustomer,
    countryCode,
    paymentAmount,
  );
  applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
    currentCustomer,
    countryCode,
    paymentAmount,
  );

  let invalid = true;

  for (let i = 0; i < paymentInstruments.length; i++) {
    const paymentInstrument = paymentInstruments[i];
    if (
      PaymentInstrument.METHOD_GIFT_CERTIFICATE.equals(
        paymentInstrument.paymentMethod,
      )
    ) {
      invalid = false;
      console.log('here1');
    }
    const paymentMethod = PaymentMgr.getPaymentMethod(
      paymentInstrument.getPaymentMethod(),
    );
    if (paymentMethod && applicablePaymentMethods.contains(paymentMethod)) {
      if (
        PaymentInstrument.METHOD_CREDIT_CARD.equals(
          paymentInstrument.paymentMethod,
        )
      ) {
        const card = PaymentMgr.getPaymentCard(
          paymentInstrument.creditCardType,
        );
        // Checks whether payment card is still applicable or if there is a credit card token set.
        if (
          (card && applicablePaymentCards.contains(card)) ||
          paymentInstrument.getCreditCardToken()
        ) {
          console.log(
            `card token is ${paymentInstrument.getCreditCardToken()}`,
          );
          invalid = false;
          console.log('here2');
        }
      } else {
        invalid = false;
        console.log('here3');
      }
    }

    if (invalid) {
      break; // there is an invalid payment instrument
    }
  }

  result.error = invalid;
  return result;
}

module.exports = validatePayment;
