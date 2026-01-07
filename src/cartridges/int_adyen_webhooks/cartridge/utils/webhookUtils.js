/**
 * Checks if the webhook event was successful
 * @param {Object} customObj - The custom object from the webhook
 * @returns {boolean} True if the webhook event was successful
 */
function isWebhookSuccessful(customObj) {
  return customObj && customObj.custom && customObj.custom.success === 'true';
}

module.exports = {
  isWebhookSuccessful,
};
