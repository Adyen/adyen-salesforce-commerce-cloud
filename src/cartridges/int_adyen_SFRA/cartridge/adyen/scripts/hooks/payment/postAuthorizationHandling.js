// Dummy implementation
/**
 * This function is to handle the post payment authorization customizations
 * @param {Object} result - the payment response
 */
// eslint-disable-next-line
function postAuthorization(result) {
  return { error: false };
}

module.exports = {
  postAuthorization,
};
