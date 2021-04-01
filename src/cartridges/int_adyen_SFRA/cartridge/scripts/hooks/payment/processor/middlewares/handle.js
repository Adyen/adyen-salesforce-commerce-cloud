const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyenConstants/constants');
const Logger = require('dw/system/Logger');

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
      const sfccCardType = AdyenHelper.getSFCCCardType(
        paymentInformation.cardType,
      );
      const tokenID = AdyenHelper.getCardToken(
        paymentInformation.storedPaymentUUID,
        customer,
      );

      Logger.getLogger('Adyen').error('payment info ' + JSON.stringify(paymentInformation));

      paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
      paymentInstrument.setCreditCardType(sfccCardType);



      if (tokenID) {
        paymentInstrument.setCreditCardExpirationMonth(
          paymentInformation.expirationMonth.value,
        );
        paymentInstrument.setCreditCardExpirationYear(
          paymentInformation.expirationYear.value,
        );
        paymentInstrument.setCreditCardToken(tokenID);
      }
    }
  });

  return { fieldErrors: cardErrors, serverErrors, error: false };
}

module.exports = handle;

// export default Handle;
