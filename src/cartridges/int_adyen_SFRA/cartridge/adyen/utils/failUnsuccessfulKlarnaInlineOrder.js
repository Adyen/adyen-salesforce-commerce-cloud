const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');

function failUnsuccessfulKlarnaInlineOrder() {
  if (session.privacy.attemptedKlarnaPayment && session.privacy.orderNo) {
    const order = OrderMgr.getOrder(session.privacy.orderNo);
    Transaction.wrap(() => {
      OrderMgr.failOrder(order, true);
      session.privacy.attemptedKlarnaPayment = null;
      session.privacy.orderNo = null;
    });
  }
}

module.exports = failUnsuccessfulKlarnaInlineOrder;
