// Dummy implementation
/**
 * This function is to handle the pre payment authorization customizations
 * @param {Object} paymentRequest - the payment request which is constructed by createPaymentRequest
 */
// eslint-disable-next-line
function preAuthorization(paymentRequest) {
  return { error: false };
}

module.exports = {
  preAuthorization,
};
