const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');
const URLUtils = require('dw/web/URLUtils');
const Logger = require('dw/system/Logger');

function redirect(type, { res }) {
  res.redirect(
    URLUtils.url(
      'Checkout-Begin',
      'stage',
      type,
      'paymentError',
      Resource.msg('error.payment.not.valid', 'checkout', null),
    ),
  );
}

function handlePlaceOrderError(order, { res, next }) {
  Transaction.wrap(() => {
    OrderMgr.failOrder(order, true);
  });
  redirect('placeOrder', { res });
  return next();
}

function toggle3DS2Error({ res, next }) {
  Logger.getLogger('Adyen').error('paymentDetails 3DS2 not available');
  redirect('payment', { res });
  return next();
}

function handlePaymentError(order, paymentInstrument, { res, next }) {
  Transaction.wrap(() => {
    OrderMgr.failOrder(order, true);
    paymentInstrument.custom.adyenPaymentData = null;
  });
  redirect('payment', { res });
  return next();
}

module.exports = {
  handlePaymentError,
  toggle3DS2Error,
  handlePlaceOrderError,
};
