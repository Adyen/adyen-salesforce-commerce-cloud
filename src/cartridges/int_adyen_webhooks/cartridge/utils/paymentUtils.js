const PaymentMgr = require('dw/order/PaymentMgr');
const Order = require('dw/order/Order');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
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

/**
 * Places an order which gets exported to OMS
 * @param {dw.order.Order} order - The order to place
 * @returns {Object} Result of placing the order
 */
function placeOrder(order) {
  const fraudDetectionStatus = { status: 'success' };
  // Only created orders can be placed
  if (order.status.value === Order.ORDER_STATUS_CREATED) {
    const placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    return placeOrderResult;
  }
  return { error: true };
}

module.exports = {
  handleAdyenPaymentInstruments,
  placeOrder,
};
