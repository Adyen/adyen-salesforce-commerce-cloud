"use strict";

var URLUtils = require('dw/web/URLUtils');

var Resource = require('dw/web/Resource');

var Transaction = require('dw/system/Transaction');

var OrderMgr = require('dw/order/OrderMgr');

var Logger = require('dw/system/Logger');

function handleRedirect(page, _ref) {
  var res = _ref.res;
  res.redirect(URLUtils.url('Checkout-Begin', 'stage', page, 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
}

function handleReceived(order, result, _ref2) {
  var res = _ref2.res,
      next = _ref2.next;
  Transaction.wrap(function () {
    OrderMgr.failOrder(order, true);
  });
  Logger.getLogger('Adyen').error("Did not complete Alipay transaction, result: ".concat(JSON.stringify(result)));
  res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
  return next();
}

function handlePaymentError(order, page, _ref3) {
  var res = _ref3.res,
      next = _ref3.next;
  Transaction.wrap(function () {
    OrderMgr.failOrder(order, true);
  });
  handleRedirect(page, {
    res: res
  });
  return next();
}

function handlePaymentInstruments(paymentInstruments, _ref4) {
  var req = _ref4.req;
  var adyenPaymentInstrument;
  var paymentData;
  var details; // looping through all Adyen payment methods, however, this only can be one.

  var instrumentsIter = paymentInstruments.iterator();

  while (instrumentsIter.hasNext()) {
    adyenPaymentInstrument = instrumentsIter.next();
    paymentData = adyenPaymentInstrument.custom.adyenPaymentData;
  } // details is either redirectResult or payload


  if (req.querystring.redirectResult) {
    details = {
      redirectResult: req.querystring.redirectResult
    };
  } else if (req.querystring.payload) {
    details = {
      payload: req.querystring.payload
    };
  }

  return {
    details: details,
    paymentData: paymentData,
    adyenPaymentInstrument: adyenPaymentInstrument
  };
}

module.exports = {
  handleRedirect: handleRedirect,
  handleReceived: handleReceived,
  handlePaymentError: handlePaymentError,
  handlePaymentInstruments: handlePaymentInstruments
};