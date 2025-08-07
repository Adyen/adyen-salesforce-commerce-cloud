const Order = require('dw/order/Order');
const OrderMgr = require('dw/order/OrderMgr');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function placeOrder(order) {
  const fraudDetectionStatus = { status: 'success' };
  // Only created orders can be placed
  if (order.status.value === Order.ORDER_STATUS_CREATED) {
    const placeOrder = COHelpers.placeOrder(order, fraudDetectionStatus);
    return placeOrder;
  }
  return { error: true };
}

function handle({ order, customObj, result, totalAmount }) {
  
  if (customObj.custom.success === 'true') {
    const amountPaid = parseFloat(customObj.custom.value);
    if (order.paymentStatus.value === Order.PAYMENT_STATUS_PAID) {
      AdyenLogs.info_log(
        `Duplicate callback received for order ${order.orderNo}.`,
      );
    } else if (amountPaid < totalAmount) {
      order.setPaymentStatus(Order.PAYMENT_STATUS_PARTPAID);
      AdyenLogs.info_log(
        `Partial amount ${customObj.custom.value} received for order number ${order.orderNo} with total amount ${totalAmount}`,
      );
    } else {
      // This if scenario can be true when shopper authorised a payment and then pressed the back button on browser
      if (order.status.value === Order.ORDER_STATUS_FAILED && amountPaid === totalAmount) {
        OrderMgr.undoFailOrder(order);
        order.trackOrderChange('Authorisation webhook received for failed order, moving order status to CREATED');
      }
      const placeOrderResult = placeOrder(order);
      if (!placeOrderResult.error) {
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        order.setExportStatus(Order.EXPORT_STATUS_READY);
        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
        AdyenLogs.info_log(
          `Order ${order.orderNo} updated to status PAID.`,
        );
        result.SubmitOrder = true;
      }
    }
    order.custom.Adyen_eventCode = customObj.custom.eventCode;
    order.custom.Adyen_value = amountPaid.toString();
  } else {
    AdyenLogs.info_log(
      `Authorization for order ${order.orderNo} was not successful - no update.`,
    );
    // Determine if payment was refused and was used Adyen payment method
    if (order.status.value === Order.ORDER_STATUS_FAILED) {
      order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
      order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
      order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
    }
  }
}

module.exports = { handle };
