"use strict";

var OrderMgr = require('dw/order/OrderMgr');

var Transaction = require('dw/system/Transaction');

var Resource = require('dw/web/Resource');

var URLUtils = require('dw/web/URLUtils');

var Logger = require('dw/system/Logger');

function redirect(type, _ref) {
  var res = _ref.res;
  res.redirect(URLUtils.url('Checkout-Begin', 'stage', type, 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
}

function handlePlaceOrderError(order, _ref2) {
  var res = _ref2.res,
      next = _ref2.next;
  Transaction.wrap(function () {
    OrderMgr.failOrder(order, true);
  });
  redirect('placeOrder', {
    res: res
  });
  return next();
}

function toggle3DS2Error(_ref3) {
  var res = _ref3.res,
      next = _ref3.next;
  Logger.getLogger('Adyen').error('paymentDetails 3DS2 not available');
  redirect('payment', {
    res: res
  });
  return next();
}

function handlePaymentError(order, paymentInstrument, _ref4) {
  var res = _ref4.res,
      next = _ref4.next;
  Transaction.wrap(function () {
    OrderMgr.failOrder(order, true);
    paymentInstrument.custom.adyenPaymentData = null;
  });
  redirect('payment', {
    res: res
  });
  return next();
}

module.exports = {
  handlePaymentError: handlePaymentError,
  toggle3DS2Error: toggle3DS2Error,
  handlePlaceOrderError: handlePlaceOrderError
};