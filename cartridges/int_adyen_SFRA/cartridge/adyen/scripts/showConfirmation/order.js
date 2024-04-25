"use strict";

var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
var clearForms = require('*/cartridge/adyen/utils/clearForms');
function handleOrderConfirm(adyenPaymentInstrument, result, order, _ref) {
  var res = _ref.res,
    next = _ref.next;
  Transaction.wrap(function () {
    AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
  });
  clearForms.clearForms();
  // determines SFRA version for backwards compatibility
  if (AdyenConfigs.getAdyenSFRA6Compatibility() === true) {
    res.render('orderConfirmForm', {
      orderID: order.orderNo,
      orderToken: order.orderToken
    });
  } else {
    res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
  }
  return next();
}
module.exports = handleOrderConfirm;