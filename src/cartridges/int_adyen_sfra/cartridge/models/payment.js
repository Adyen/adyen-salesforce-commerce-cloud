const collections = require('*/cartridge/scripts/util/collections');
const { createSelectedPaymentInstruments } = require('./createPayment');

const base = module.superModule;

/**
 * Creates an array of objects containing selected payment information
 * @param {dw.util.ArrayList<dw.order.PaymentInstrument>} selectedPaymentInstruments - ArrayList
 *      of payment instruments that the user is using to pay for the current basket
 * @returns {Array} Array of objects that contain information about the selected payment instruments
 */
function getSelectedPaymentInstruments(selectedPaymentInstruments) {
  return collections.map(
    selectedPaymentInstruments,
    createSelectedPaymentInstruments,
  );
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
  const { paymentInstruments } = currentBasket;

  this.selectedPaymentInstruments = paymentInstruments
    ? getSelectedPaymentInstruments(paymentInstruments)
    : null;
}

module.exports = Payment;
