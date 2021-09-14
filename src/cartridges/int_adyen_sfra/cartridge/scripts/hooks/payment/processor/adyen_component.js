/**
 *
 */
const middlewares = require('./middlewares/index');

function Handle(basket, paymentInformation) {
  return middlewares.handle(basket, paymentInformation);
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
  return middlewares.authorize(
    orderNumber,
    paymentInstrument,
    paymentProcessor,
  );
}

exports.Handle = Handle;
exports.Authorize = Authorize;
