/**
 *
 */
const middlewares = require('*/cartridge/adyen/scripts/hooks/payment/processor/middlewares/index');

function Handle(basket, paymentInformation) {
  return middlewares.handle(basket, paymentInformation);
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {dw.order.Order} order - The current order
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(order, paymentInstrument, paymentProcessor) {
  return middlewares.authorize(order, paymentInstrument, paymentProcessor);
}

exports.Handle = Handle;
exports.Authorize = Authorize;
