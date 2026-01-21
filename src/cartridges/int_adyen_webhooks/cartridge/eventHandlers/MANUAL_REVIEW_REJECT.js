const Order = require('dw/order/Order');
const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const { isWebhookSuccessful } = require('*/cartridge/utils/webhookUtils');

function handle({ order, customObj }) {
  if (isWebhookSuccessful(customObj)) {
    order.trackOrderChange(
      'Manual review is not accepted in Adyen Customer Area, failing the order',
    );
    order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
    Transaction.wrap(() => {
      OrderMgr.failOrder(order, false);
    });
  }
}

module.exports = { handle };
