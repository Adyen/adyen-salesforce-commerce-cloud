const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function handle({ order }) {
  AdyenLogs.info_log(`Order ${order.orderNo} was in pending status.`);
  return { pending: true };
}

module.exports = { handle };
