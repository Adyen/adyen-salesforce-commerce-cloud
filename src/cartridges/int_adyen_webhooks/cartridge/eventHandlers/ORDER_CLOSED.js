const Order = require('dw/order/Order');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const { placeOrder } = require('../utils/paymentUtils');
const { isWebhookSuccessful } = require('../utils/webhookUtils');

function handle({ order, customObj, totalAmount }) {
  // Placing the order for partial payments once ORDER_CLOSED webhook came, and the total amount matches order amount
  if (
    isWebhookSuccessful(customObj) &&
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
