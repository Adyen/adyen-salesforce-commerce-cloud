"use strict";

var Transaction = require('dw/system/Transaction');

var URLUtils = require('dw/web/URLUtils');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var _require = require('../../../utils/index'),
    clearForms = _require.clearForms;

function handleOrderConfirm(order, orderModel, adyenPaymentInstrument, result, _ref) {
  var res = _ref.res,
      next = _ref.next;
  Transaction.wrap(function () {
    order.custom.Adyen_CustomerEmail = JSON.stringify(orderModel);
    AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
  });
  clearForms.clearForms(); // determines SFRA version for backwards compatibility

  if (AdyenHelper.getAdyenSFRA6Compatibility() === true) {
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