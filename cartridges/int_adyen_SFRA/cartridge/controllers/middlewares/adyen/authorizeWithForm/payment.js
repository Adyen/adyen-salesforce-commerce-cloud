"use strict";

var Transaction = require('dw/system/Transaction');

var OrderMgr = require('dw/order/OrderMgr');

var Resource = require('dw/web/Resource');

var URLUtils = require('dw/web/URLUtils');

function handleInvalidPayment(order, page, _ref) {
  var res = _ref.res,
      next = _ref.next;
  Transaction.wrap(function () {
    OrderMgr.failOrder(order, true);
  });
  res.redirect(URLUtils.url('Checkout-Begin', 'stage', page, 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
  return next();
}

module.exports = handleInvalidPayment;