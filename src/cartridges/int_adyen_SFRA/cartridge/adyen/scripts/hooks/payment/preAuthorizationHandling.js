// Dummy implementation
/**
 * This function is to handle the pre payment authorization customizations
 * @param {Object} data - Data to be passed for pre-authorization
 */
// eslint-disable-next-line
function preAuthorization(paymentRequest) {
  return { error: false };
}

module.exports = {
  preAuthorization,
};
