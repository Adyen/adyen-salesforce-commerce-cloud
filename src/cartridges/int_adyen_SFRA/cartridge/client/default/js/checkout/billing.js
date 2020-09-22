function hasData(...args) {
  return args.every((arg) => !!arg);
}

function appendToPaymentSummary(html) {
  // update payment details
  const paymentSummary = document.querySelector('.payment-details');
  paymentSummary.innerHTML += html;
}

function appendMaskedCC({ maskedCreditCardNumber }) {
  const innerHTML = `<div>${maskedCreditCardNumber}</div>`;
  return maskedCreditCardNumber && appendToPaymentSummary(innerHTML);
}

function appendIssuerName({ selectedIssuerName }) {
  const innerHTML = `<div><span>${selectedIssuerName}</span></div>`;
  return selectedIssuerName && appendToPaymentSummary(innerHTML);
}
function appendExpiration({ expirationMonth, expirationYear }, order) {
  const innerHTML = `<div><span>${order.resources.cardEnding} ${expirationMonth}/${expirationYear}</span></div>`;
  return (
    hasData(expirationMonth, expirationYear) &&
    appendToPaymentSummary(innerHTML)
  );
}

function appendPaymentMethod({ selectedAdyenPM }) {
  const innerHTML = `<div><span>${selectedAdyenPM}</span></div>`;
  return selectedAdyenPM && appendToPaymentSummary(innerHTML);
}

/**
 * Updates the payment information in checkout, based on the supplied order model
 * @param {Object} order - checkout model to use as basis of new truth
 */
function updatePaymentInformation(order) {
  if (order.billing.payment.selectedPaymentInstruments?.length) {
    const selectedPaymentInstrument =
      order.billing.payment.selectedPaymentInstruments[0];

    document.querySelector('.payment-details').innerHTML = '';
    appendPaymentMethod(selectedPaymentInstrument);
    appendIssuerName(selectedPaymentInstrument);
    appendMaskedCC(selectedPaymentInstrument);
    appendExpiration(selectedPaymentInstrument, order);
  }
}

module.exports.methods = { updatePaymentInformation };
