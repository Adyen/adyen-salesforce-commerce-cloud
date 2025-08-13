const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function handle({ order, customObj }) {
  if (customObj.custom.success === 'true') {
    order.custom.Adyen_donationAmount = parseFloat(customObj.custom.value);
  } else {
    AdyenLogs.info_log(`Donation failed for order ${order.orderNo}`);
  }
}

module.exports = { handle };
