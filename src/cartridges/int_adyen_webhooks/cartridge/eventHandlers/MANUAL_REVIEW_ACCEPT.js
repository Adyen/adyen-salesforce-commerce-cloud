const { isWebhookSuccessful } = require('*/cartridge/utils/webhookUtils');
const {
  handleSuccessfulAuthorisation,
} = require('*/cartridge/eventHandlers/AUTHORISATION');

function handle({ order, customObj, result }) {
  if (isWebhookSuccessful(customObj)) {
    order.trackOrderChange(
      'Manual review is accepted in Adyen Customer Area, placing the order',
    );
    handleSuccessfulAuthorisation(order, result);
  }
}

module.exports = { handle };
