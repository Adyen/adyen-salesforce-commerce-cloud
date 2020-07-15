const collections = require('*/cartridge/scripts/util/collections');

const base = module.superModule;

/**
 * Creates an array of objects containing selected payment information
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList
 *      of payment instruments that the user is using to pay for the current basket
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */
function getSelectedPaymentInstruments(selectedPaymentInstruments) {
  return collections.map(selectedPaymentInstruments, function (
    paymentInstrument,
  ) {
    const results = {
      paymentMethod: paymentInstrument.paymentMethod,
      amount: paymentInstrument.paymentTransaction.amount.value,
    };

    if (paymentInstrument.custom.adyenPaymentMethod) {
      results.selectedAdyenPM = paymentInstrument.custom.adyenPaymentMethod;
    }
    if (paymentInstrument.custom.adyenIssuerName) {
      results.selectedIssuerName = paymentInstrument.custom.adyenIssuerName;
    }
    if (paymentInstrument.custom.adyenAdditionalPaymentData) {
      results.adyenAdditionalPaymentData = JSON.parse(
        paymentInstrument.custom.adyenAdditionalPaymentData,
      );
    }
    if (paymentInstrument.custom.adyenAction) {
      results.adyenAction = paymentInstrument.custom.adyenAction;
    }

    results.lastFour = paymentInstrument.creditCardNumberLastDigits
      ? paymentInstrument.creditCardNumberLastDigits
      : null;
    results.owner = paymentInstrument.creditCardHolder
      ? paymentInstrument.creditCardHolder
      : null;
    results.expirationYear = paymentInstrument.creditCardExpirationYear
      ? paymentInstrument.creditCardExpirationYear
      : null;
    results.type = paymentInstrument.creditCardType
      ? paymentInstrument.creditCardType
      : null;
    results.maskedCreditCardNumber = paymentInstrument.maskedCreditCardNumber
      ? paymentInstrument.maskedCreditCardNumber
      : null;
    results.expirationMonth = paymentInstrument.creditCardExpirationMonth
      ? paymentInstrument.creditCardExpirationMonth
      : null;

    if (paymentInstrument.paymentMethod === 'GIFT_CERTIFICATE') {
      results.giftCertificateCode = paymentInstrument.giftCertificateCode;
      results.maskedGiftCertificateCode = paymentInstrument.maskedGiftCertificateCode;
    }

    return results;
  });
}

/**
 * Payment class that represents payment information for the current basket
 * @param {dw.order.Basket} currentBasket - the target Basket object
 * @param {dw.customer.Customer} currentCustomer - the associated Customer object
 * @param {string} countryCode - the associated Site countryCode
 * @constructor
 */
function Payment(currentBasket, currentCustomer, countryCode) {
  base.call(this, currentBasket, currentCustomer, countryCode);
  const paymentInstruments = currentBasket.paymentInstruments;

  this.selectedPaymentInstruments = paymentInstruments
    ? getSelectedPaymentInstruments(paymentInstruments)
    : null;
}

module.exports = Payment;
