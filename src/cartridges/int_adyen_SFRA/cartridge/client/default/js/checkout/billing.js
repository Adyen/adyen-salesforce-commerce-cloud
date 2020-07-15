/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 */
function updatePaymentInformation(order) {
  // update payment details
  const $paymentSummary = $('.payment-details');
  let htmlToAppend = '';

  if (
    order.billing.payment
    && order.billing.payment.selectedPaymentInstruments
    && order.billing.payment.selectedPaymentInstruments.length > 0
  ) {
    const selectedPaymentInstrument = order.billing.payment.selectedPaymentInstruments[0];
    if (selectedPaymentInstrument.selectedAdyenPM) {
      htmlToAppend
        += `<div><span>${
          selectedPaymentInstrument.selectedAdyenPM
        }</span></div>`;
    }
    if (selectedPaymentInstrument.selectedIssuerName) {
      htmlToAppend
        += `<div><span>${
          selectedPaymentInstrument.selectedIssuerName
        }</span></div>`;
    }
    if (selectedPaymentInstrument.maskedCreditCardNumber) {
      htmlToAppend
        += `<div>${selectedPaymentInstrument.maskedCreditCardNumber}</div>`;
    }
    if (
      selectedPaymentInstrument.expirationMonth
      && selectedPaymentInstrument.expirationYear
    ) {
      htmlToAppend
        += `<div><span>${
          order.resources.cardEnding
        } ${
          selectedPaymentInstrument.expirationMonth
        }/${
          selectedPaymentInstrument.expirationYear
        }</span></div>`;
    }
  }

  $paymentSummary.empty().append(htmlToAppend);
}

module.exports = {
  methods: {
    updatePaymentInformation: updatePaymentInformation,
  },
};
