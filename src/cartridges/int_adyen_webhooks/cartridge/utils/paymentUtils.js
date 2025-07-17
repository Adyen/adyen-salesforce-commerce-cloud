const PaymentMgr = require('dw/order/PaymentMgr');
const constants = require('*/cartridge/adyen/config/constants');

/**
 * Checks Adyen payment instruments and updates Adyen_log if found.
 * @param {Object} paymentInstruments - The payment instruments collection
 * @param {Object} customObj - The custom object containing Adyen_log
 * @returns {boolean} - True if any Adyen instrument was found
 */
function handleAdyenPaymentInstruments(paymentInstruments, customObj) {
  const adyenMethods = [
    constants.METHOD_ADYEN_POS,
    constants.METHOD_ADYEN_COMPONENT,
    constants.METHOD_CREDIT_CARD,
  ];
  const adyenProcessors = [
    constants.PAYMENT_INSTRUMENT_ADYEN_POS,
    constants.PAYMENT_INSTRUMENT_ADYEN_COMPONENT,
  ];

  let foundAdyen = false;
  Object.values(paymentInstruments).forEach((pi) => {
    const methodMatch = adyenMethods.includes(pi.paymentMethod);
    const processor = PaymentMgr.getPaymentMethod(
      pi.getPaymentMethod(),
    ).getPaymentProcessor().ID;
    const processorMatch = adyenProcessors.includes(processor);
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
