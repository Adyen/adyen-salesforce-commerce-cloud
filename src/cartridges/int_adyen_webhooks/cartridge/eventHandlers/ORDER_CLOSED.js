const Order = require('dw/order/Order');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

// TODO: This function should be moved to checkoutHelpers or specific eventCode handler
function placeOrder(order) {
  const fraudDetectionStatus = { status: 'success' };
  // Only created orders can be placed
  if (order.status.value === Order.ORDER_STATUS_CREATED) {
    const placeOrder = COHelpers.placeOrder(order, fraudDetectionStatus);
    return placeOrder;
  }
  return { error: true };
}

function handle({ order, customObj, totalAmount }) {
  // Placing the order for partial payments once ORDER_CLOSED webhook came, and the total amount matches order amount
  if (
    customObj.custom.success === 'true' &&
    parseFloat(customObj.custom.value) === parseFloat(totalAmount)
  ) {
    const placeOrderResult = placeOrder(order);
    if (!placeOrderResult.error) {
      order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
      order.setExportStatus(Order.EXPORT_STATUS_READY);
      order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
      AdyenLogs.info_log(`Order ${order.orderNo} placed and closed`);
    }
  }
}

module.exports = { handle };
