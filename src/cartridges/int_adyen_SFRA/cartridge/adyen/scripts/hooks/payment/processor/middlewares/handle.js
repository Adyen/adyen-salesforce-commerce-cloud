const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyen/config/constants');

function removeAllPaymentInstruments(currentBasket) {
  collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
    currentBasket.removePaymentInstrument(item);
  });
}

function resolveCardBrand(paymentInformation, stateData) {
  return (
    paymentInformation.cardType ||
    // co-branded cards carry the shopper's brand selection in the state data
    stateData?.paymentMethod?.brand ||
    stateData?.paymentMethod?.srcScheme
  );
}

function resolveSfccCardType(paymentInformation, cardBrand) {
  if (paymentInformation.creditCardToken) {
    return paymentInformation.cardType;
  }
  return cardBrand ? AdyenHelper.getSfccCardType(cardBrand) : '';
}

function setCardPaymentMethod(paymentInstrument, paymentMethodNames) {
  const { sfccCardType, cardBrand, adyenPaymentMethod } = paymentMethodNames;
  // brands missing from card-type-mapping.json must not blank the attributes
  const paymentMethodName = sfccCardType || cardBrand || adyenPaymentMethod;
  if (!paymentMethodName) {
    return;
  }
  paymentInstrument.custom.adyenPaymentMethod = paymentMethodName;
  paymentInstrument.custom[`${constants.OMS_NAMESPACE}__Adyen_Payment_Method`] =
    paymentMethodName;
}

function setStoredCardFields(paymentInformation, paymentInstrument) {
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

function convertToSfccCardType(paymentInformation, paymentInstrument) {
  const stateData = JSON.parse(paymentInformation.stateData);
  const cardBrand = resolveCardBrand(paymentInformation, stateData);
  const sfccCardType = resolveSfccCardType(paymentInformation, cardBrand);

  paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
  if (sfccCardType) {
    paymentInstrument.setCreditCardType(sfccCardType);
  }
  if (paymentInformation.cardHolder) {
    paymentInstrument.setCreditCardHolder(paymentInformation.cardHolder);
  }

  setCardPaymentMethod(paymentInstrument, {
    sfccCardType,
    cardBrand,
    adyenPaymentMethod: paymentInformation.adyenPaymentMethod,
  });

  if (paymentInformation.creditCardToken) {
    setStoredCardFields(paymentInformation, paymentInstrument);
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
