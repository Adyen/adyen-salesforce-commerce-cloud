const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyen/config/constants');

function removeAllPaymentInstruments(currentBasket) {
  collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
    currentBasket.removePaymentInstrument(item);
  });
}

function convertToSfccCardType(paymentInformation, paymentInstrument) {
  const stateData = JSON.parse(paymentInformation.stateData);
  const cardType =
    paymentInformation.cardType || stateData?.paymentMethod?.srcScheme;
  const sfccCardType = !paymentInformation.creditCardToken
    ? AdyenHelper.getSfccCardType(cardType)
    : paymentInformation.cardType;

  paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
  paymentInstrument.setCreditCardType(sfccCardType);

  paymentInstrument.custom.adyenPaymentMethod = sfccCardType;
  paymentInstrument.custom[`${constants.OMS_NAMESPACE}__Adyen_Payment_Method`] =
    sfccCardType;

  if (paymentInformation.creditCardToken) {
    const firstTwoDigitsFromCurrentYear =
      AdyenHelper.getFirstTwoNumbersFromYear();
    const expirationYear =
      firstTwoDigitsFromCurrentYear * 100 + paymentInformation.expirationYear;
    paymentInstrument.setCreditCardExpirationMonth(
      paymentInformation.expirationMonth,
    );
    paymentInstrument.setCreditCardExpirationYear(expirationYear);
    paymentInstrument.setCreditCardToken(paymentInformation.creditCardToken);
  }
}

function handle(basket, paymentInformation) {
  const currentBasket = basket;
  const cardErrors = {};
  const serverErrors = [];

  Transaction.wrap(() => {
    removeAllPaymentInstruments(currentBasket);

    const paymentInstrumentType = AdyenHelper.getPaymentInstrumentType(
      paymentInformation.isCreditCard,
    );
    const paymentInstrument = currentBasket.createPaymentInstrument(
      paymentInstrumentType,
      currentBasket.totalGrossPrice,
    );
    paymentInstrument.custom.adyenPaymentData = paymentInformation.stateData;
    paymentInstrument.custom.adyenMainPaymentInstrument = paymentInstrumentType;
    paymentInstrument.custom.adyenPaymentMethod =
      paymentInformation.adyenPaymentMethod;

    if (paymentInformation.partialPaymentsOrder) {
      paymentInstrument.custom.adyenPartialPaymentsOrder =
        currentBasket.custom.partialPaymentOrderData;
    }

    if (paymentInformation.stateData) {
      const paymentRequest = JSON.parse(paymentInformation.stateData);
      AdyenHelper.setPaymentInstrumentFields(
        paymentInstrument,
        paymentRequest,
        paymentInformation.adyenPaymentMethod,
      );
    }

    if (paymentInformation.isCreditCard) {
      convertToSfccCardType(paymentInformation, paymentInstrument);
    }
  });

  return { fieldErrors: cardErrors, serverErrors, error: false };
}

module.exports = handle;
