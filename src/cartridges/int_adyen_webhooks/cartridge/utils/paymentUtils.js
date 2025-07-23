const PaymentMgr = require('dw/order/PaymentMgr');
const constants = require('./constants');

/**
 * Checks Adyen payment instruments and updates Adyen_log if found.
 * @param {Object} paymentInstruments - The payment instruments collection
 * @param {Object} customObj - The custom object containing Adyen_log
 * @returns {boolean} - True if any Adyen instrument was found
 */
function handleAdyenPaymentInstruments(paymentInstruments, customObj) {
  let foundAdyen = false;
  Object.values(paymentInstruments).forEach((pi) => {
    const methodMatch = constants.ADYEN_METHODS.includes(pi.paymentMethod);
    const processor = PaymentMgr.getPaymentMethod(
      pi.getPaymentMethod(),
    ).getPaymentProcessor().ID;
    const processorMatch = constants.ADYEN_PROCESSORS.includes(processor);
    if (methodMatch || processorMatch) {
      foundAdyen = true;
      pi.paymentTransaction.custom.Adyen_log = customObj.custom.Adyen_log;
    }
  });
  return foundAdyen;
}

module.exports = {
  handleAdyenPaymentInstruments,
};
