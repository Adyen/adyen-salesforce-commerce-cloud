const Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const { isWebhookSuccessful } = require('*/cartridge/utils/webhookUtils');

function handle({ order, customObj }) {
  if (isWebhookSuccessful(customObj)) {
    order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
    order.trackOrderChange('Capture failed, cancelling order');
    OrderMgr.cancelOrder(order);
  }
  AdyenLogs.info_log(`Capture failed for order ${order.orderNo}`);
}

module.exports = { handle };
