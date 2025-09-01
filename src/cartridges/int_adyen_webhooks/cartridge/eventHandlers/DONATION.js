const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const { isWebhookSuccessful } = require('../utils/webhookUtils');

function handle({ order, customObj }) {
  if (isWebhookSuccessful(customObj)) {
    order.custom.Adyen_donationAmount = parseFloat(customObj.custom.value);
  } else {
    AdyenLogs.info_log(`Donation failed for order ${order.orderNo}`);
  }
}

module.exports = { handle };
