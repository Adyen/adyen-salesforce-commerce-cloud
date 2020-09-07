const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const PaymentInstrument = require('dw/order/PaymentInstrument');
const { getPayments, validatePaymentMethod } = require('./utils/index');

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {Object} an error object
 */
function handlePayments(order, orderNumber) {
  if (order.totalNetPrice === 0.0) {
    return {};
  }

  if (order.paymentInstruments.length) {
    return getPayments(order, orderNumber);
  }

  Transaction.wrap(() => {
    OrderMgr.failOrder(order, true);
  });
  return { error: true };
}

/**
 * Validates payment
 * @param {Object} req - The local instance of the request object
 * @param {dw.order.Basket} currentBasket - The current basket
 * @returns {Object} an object that has error information
 */
function validatePayment(req, currentBasket) {
  const creditCardPaymentMethod = PaymentMgr.getPaymentMethod(
    PaymentInstrument.METHOD_CREDIT_CARD,
  );
  const paymentAmount = currentBasket.totalGrossPrice.value;
  const { countryCode } = req.geolocation;
  const currentCustomer = req.currentCustomer.raw;
  const { paymentInstruments } = currentBasket;
  const result = {};

  const applicablePaymentMethods = PaymentMgr.getApplicablePaymentMethods(
    currentCustomer,
    countryCode,
    paymentAmount,
  );
  const applicablePaymentCards = creditCardPaymentMethod.getApplicablePaymentCards(
    currentCustomer,
    countryCode,
    paymentAmount,
  );

  const validatePaymentInstrument = validatePaymentMethod(
    applicablePaymentCards,
    applicablePaymentMethods,
  );

  const isValid = paymentInstruments.toArray().every(validatePaymentInstrument);
  result.error = !isValid;
  return result;
}

module.exports = {
  handlePayments,
  validatePayment,
};
