const Order = require('dw/order/Order');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function handle({ order }) {
  order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
  order.trackOrderChange('CANCEL_OR_REFUND notification received');
  AdyenLogs.info_log(`Order ${order.orderNo} was cancelled or refunded.`);
}

module.exports = { handle };
