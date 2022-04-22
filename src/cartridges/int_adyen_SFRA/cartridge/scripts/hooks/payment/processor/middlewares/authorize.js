const Resource = require('dw/web/Resource');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

function errorHandler() {
  const serverErrors = [
    Resource.msg('error.payment.processor.not.supported', 'checkout', null),
  ];

  return {
    authorized: false,
    fieldErrors: [],
    serverErrors,
    error: true,
  };
}

function paymentErrorHandler(result) {
  Logger.getLogger('Adyen').error(
    `Payment failed, result: ${JSON.stringify(result)}`,
  );
  Transaction.rollback();
  return { error: true };
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
function authorize(order, paymentInstrument, paymentProcessor) {
  Transaction.wrap(() => {
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
  });

  Transaction.begin();
  const result = adyenCheckout.createPaymentRequest({
    Order: order,
    PaymentInstrument: paymentInstrument,
  });
  if (result.error) {
    return errorHandler();
  }

  const checkoutResponse = AdyenHelper.createAdyenCheckoutResponse(result);
  if (!checkoutResponse.isFinal) {
    return checkoutResponse;
  }

  if (!checkoutResponse.isSuccessful) {
    return paymentErrorHandler(result);
  }

  AdyenHelper.savePaymentDetails(paymentInstrument, order, result.fullResponse);
  Transaction.commit();
  return { authorized: true, error: false };
}

module.exports = authorize;
