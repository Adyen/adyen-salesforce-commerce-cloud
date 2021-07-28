"use strict";

var OrderMgr = require('dw/order/OrderMgr');

var Logger = require('dw/system/Logger');

var Transaction = require('dw/system/Transaction');

var URLUtils = require('dw/web/URLUtils');

var Resource = require('dw/web/Resource');

var constants = require('*/cartridge/adyenConstants/constants');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function handleIncorrectSignature(order, _ref) {
  var res = _ref.res,
      next = _ref.next;
  Logger.getLogger('Adyen').error('Redirect signature is not correct');
  Transaction.wrap(function () {
    OrderMgr.failOrder(order, true);
  });
  res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
  return next();
}

function getCurrentSignature(order) {
  var paymentInstruments = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);
  var adyenPaymentInstrument = paymentInstruments[0];
  var paymentData = adyenPaymentInstrument.custom.adyenPaymentData;
  var redirectUrl = adyenPaymentInstrument.custom.adyenRedirectURL;
  return AdyenHelper.getAdyenHash(redirectUrl.substr(redirectUrl.length - 25), paymentData.substr(1, 25));
}

module.exports = {
  handleIncorrectSignature: handleIncorrectSignature,
  getCurrentSignature: getCurrentSignature
};