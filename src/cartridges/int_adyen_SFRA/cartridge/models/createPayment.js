function getField(name, obj) {
  return obj && { [name]: obj };
}

function getParsedField(name, str) {
  return str && { [name]: JSON.parse(str) };
}

function getOrNull(name, obj) {
  return obj ? { [name]: obj } : { [name]: null };
}
module.exports.createSelectedPaymentInstruments =
  function createSelectedPaymentInstruments({
    paymentMethod,
    paymentTransaction,
    custom,
    creditCardNumberLastDigits,
    creditCardExpirationMonth,
    creditCardExpirationYear,
    creditCardHolder,
    creditCardType,
    giftCertificateCode,
    maskedGiftCertificateCode,
    maskedCreditCardNumber,
  }) {
    const results = {
      paymentMethod,
      amount: paymentTransaction.amount.value,
      ...getField('selectedAdyenPM', custom.adyenPaymentMethod),
      ...getField('selectedIssuerName', custom.adyenIssuerName),
      ...getParsedField(
        'adyenAdditionalPaymentData',
        custom.adyenAdditionalPaymentData,
      ),
      ...getField('adyenAction', custom.adyenAction),
      ...getOrNull('lastFour', creditCardNumberLastDigits),
      ...getOrNull('owner', creditCardHolder),
      ...getOrNull('expirationYear', creditCardExpirationYear),
      ...getOrNull('type', creditCardType),
      ...getOrNull('maskedCreditCardNumber', maskedCreditCardNumber),
      ...getOrNull('expirationMonth', creditCardExpirationMonth),
    };

    if (paymentMethod === 'GIFT_CERTIFICATE') {
      results.giftCertificateCode = giftCertificateCode;
      results.maskedGiftCertificateCode = maskedGiftCertificateCode;
    }

    return results;
  };
