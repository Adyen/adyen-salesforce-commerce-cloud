const Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function handle({ order, customObj }) {
  if (
    customObj.custom.success === 'true' &&
    order.status.value === Order.ORDER_STATUS_CANCELLED
  ) {
    order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
    order.setExportStatus(Order.EXPORT_STATUS_READY);
    order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
    OrderMgr.undoCancelOrder(order);
    AdyenLogs.info_log(
      `Undo failed capture, Order ${order.orderNo} updated to status PAID.`,
    );
  }
}

module.exports = { handle };
