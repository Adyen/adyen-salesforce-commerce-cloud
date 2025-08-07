const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function handle({ order, customObj }) {
  if (customObj.custom.success === 'true') {
    AdyenLogs.info_log(
      `Order ${order.orderNo} opened for partial payments`,
    );
  }
}

module.exports = { handle };
