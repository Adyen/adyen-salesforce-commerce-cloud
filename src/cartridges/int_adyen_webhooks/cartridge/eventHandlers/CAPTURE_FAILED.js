const Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function handle({ order, customObj }) {
  if (customObj.custom.success === 'true') {
    order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
    order.trackOrderChange('Capture failed, cancelling order');
    OrderMgr.cancelOrder(order);
  }
  AdyenLogs.info_log(`Capture Failed for order ${order.orderNo}`);
}

module.exports = { handle };
