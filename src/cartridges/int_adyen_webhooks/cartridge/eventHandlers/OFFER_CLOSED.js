const Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function handle({ order }) {
  order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
  order.trackOrderChange('Offer closed, failing order');
  Transaction.wrap(() => {
    OrderMgr.failOrder(order, false);
  });
  AdyenLogs.info_log(
    `Offer closed for order ${order.orderNo} and updated to status NOT PAID.`,
  );
}

module.exports = { handle };
