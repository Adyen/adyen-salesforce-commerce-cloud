const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const Resource = require('dw/web/Resource');
const URLUtils = require('dw/web/URLUtils');

function handleInvalidPayment(order, page, { res, next }) {
  Transaction.wrap(() => {
    OrderMgr.failOrder(order, true);
  });
  res.redirect(
    URLUtils.url(
      'Checkout-Begin',
      'stage',
      page,
      'paymentError',
      Resource.msg('error.payment.not.valid', 'checkout', null),
    ),
  );
  return next();
}

module.exports = handleInvalidPayment;
