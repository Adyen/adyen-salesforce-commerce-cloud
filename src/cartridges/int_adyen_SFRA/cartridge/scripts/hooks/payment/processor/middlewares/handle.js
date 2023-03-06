const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyenConstants/constants');

function removeAllPaymentInstruments(currentBasket) {
  collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
    currentBasket.removePaymentInstrument(item);
  });
}

function convertToSfccCardType(paymentInformation, paymentInstrument) {
  const sfccCardType = !paymentInformation.creditCardToken
    ? AdyenHelper.getSfccCardType(paymentInformation.cardType)
    : paymentInformation.cardType;

  paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
  paymentInstrument.setCreditCardType(sfccCardType);

  paymentInstrument.custom.adyenPaymentMethod = sfccCardType;
  paymentInstrument.custom[
    `${constants.OMS_NAMESPACE}_Adyen_Payment_Method`
  ] = sfccCardType;

  if (paymentInformation.creditCardToken) {
    paymentInstrument.setCreditCardExpirationMonth(
      paymentInformation.expirationMonth,
    );
    paymentInstrument.setCreditCardExpirationYear(
      paymentInformation.expirationYear,
    );
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
        session.privacy.partialPaymentData;
    }

    paymentInstrument.custom.Adyen_Payment_Method_Variant = paymentInformation.stateData
      ? JSON.parse(paymentInformation.stateData)?.paymentMethod?.type
      : null;
    paymentInstrument.custom[
      `${constants.OMS_NAMESPACE}_Adyen_Payment_Method_Variant`
    ] = paymentInformation.stateData
      ? JSON.parse(paymentInformation.stateData)?.paymentMethod?.type
      : null;
    if (paymentInformation.isCreditCard) {
      // If the card wasn't a stored card we need to convert sfccCardType
      convertToSfccCardType(paymentInformation, paymentInstrument);
    } else {
      paymentInstrument.custom[
        `${constants.OMS_NAMESPACE}_Adyen_Payment_Method`
      ] = paymentInformation.adyenPaymentMethod;
    }
  });

  return { fieldErrors: cardErrors, serverErrors, error: false };
}

module.exports = handle;
