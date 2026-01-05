const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const { isWebhookSuccessful } = require('*/cartridge/utils/webhookUtils');

function handle({ order, customObj }) {
  if (isWebhookSuccessful(customObj)) {
    AdyenLogs.info_log(`Order ${order.orderNo} opened for partial payments`);
  }
}

module.exports = { handle };
