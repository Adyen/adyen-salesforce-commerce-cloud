"use strict";

var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var _require = require('*/cartridge/controllers/utils/index'),
  clearForms = _require.clearForms;
function handleOrderConfirm(adyenPaymentInstrument, result, order, orderModel, _ref) {
  var res = _ref.res,
    next = _ref.next;
  Transaction.wrap(function () {
    order.custom.Adyen_CustomerEmail = JSON.stringify(orderModel);
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