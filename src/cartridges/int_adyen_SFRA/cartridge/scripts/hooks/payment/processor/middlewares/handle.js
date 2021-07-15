const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyenConstants/constants');

function handle(basket, paymentInformation) {
  const currentBasket = basket;
  const cardErrors = {};
  const serverErrors = [];
  Transaction.wrap(() => {
    collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
      currentBasket.removePaymentInstrument(item);
    });
    const paymentInstrument = currentBasket.createPaymentInstrument(
      constants.METHOD_ADYEN_COMPONENT,
      currentBasket.totalGrossPrice,
    );
    paymentInstrument.custom.adyenPaymentData = paymentInformation.stateData;
    paymentInstrument.custom.adyenPaymentMethod =
      paymentInformation.adyenPaymentMethod;

    if (paymentInformation.isCreditCard) {
      // If the card wasn't a stored card we need to convert sfccCardType
      const sfccCardType = !paymentInformation.creditCardToken
        ? AdyenHelper.getSFCCCardType(paymentInformation.cardType)
        : paymentInformation.cardType;

      paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
      paymentInstrument.setCreditCardType(sfccCardType);
      paymentInstrument.custom.adyenPaymentMethod = sfccCardType;

      if (paymentInformation.creditCardToken) {
        paymentInstrument.setCreditCardExpirationMonth(
          paymentInformation.expirationMonth,
        );
        paymentInstrument.setCreditCardExpirationYear(
          paymentInformation.expirationYear,
        );
        paymentInstrument.setCreditCardToken(
          paymentInformation.creditCardToken,
        );
      }
    }
  });

  return { fieldErrors: cardErrors, serverErrors, error: false };
}

module.exports = handle;

// export default Handle;
