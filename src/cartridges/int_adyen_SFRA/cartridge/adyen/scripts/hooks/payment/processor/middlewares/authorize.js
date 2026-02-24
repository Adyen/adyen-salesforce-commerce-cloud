const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const hooksHelper = require('*/cartridge/scripts/helpers/hooks');
const postAuthorizationHook = require('*/cartridge/adyen/scripts/hooks/payment/postAuthorizationHandling');

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
  AdyenLogs.error_log('Payment failed:', JSON.stringify(result));
  Transaction.rollback();
  return { error: true };
}

/**
 * Validates the payment result and checkout response
 * @param {Object} result - The payment request result
 * @returns {Object|null} Returns error object if validation fails, null if successful
 */
function validatePaymentResult(result) {
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

  return null;
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
  try {
    Transaction.wrap(() => {
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    Transaction.begin();
    const result = adyenCheckout.createPaymentRequest({
      Order: order,
      OrderNo: order.getOrderNo(),
      OrderToken: order.getOrderToken(),
    });

    const validationError = validatePaymentResult(result);
    if (validationError) {
      return validationError;
    }

    const postAuthResult = hooksHelper(
      'app.payment.post.auth',
      'postAuthorization',
      result.fullResponse,
      postAuthorizationHook.postAuthorization,
    );
    if (postAuthResult?.error) {
      return postAuthResult;
    }

    AdyenHelper.savePaymentDetails(
      paymentInstrument,
      order,
      result.fullResponse,
    );
    Transaction.commit();
    return { authorized: true, error: false };
  } catch (error) {
    AdyenLogs.error_log('Payment failed:', error);
    return { error: true };
  }
}

module.exports = authorize;
