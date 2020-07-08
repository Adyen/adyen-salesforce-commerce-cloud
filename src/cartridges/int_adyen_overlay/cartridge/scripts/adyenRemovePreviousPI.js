/**
 * Script removing all previous added payment instruments from the provided basket
 *
 * @input Basket : dw.order.Basket The basket
 *
 */

function removePaymentInstruments(basket) {
  // verify that we have a basket
  if (!basket) {
    return { error: true };
  }

  // get all payment instruments
  const paymentInstruments = basket.getPaymentInstruments();
  const iter = paymentInstruments.iterator();

  // remove them
  while (iter.hasNext()) {
    basket.removePaymentInstrument(iter.next());
  }

  return { error: false };
}

module.exports = {
  removePaymentInstruments: removePaymentInstruments,
};
