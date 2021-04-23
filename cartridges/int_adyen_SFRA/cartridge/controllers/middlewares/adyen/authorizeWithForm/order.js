"use strict";

var Transaction = require('dw/system/Transaction');

var URLUtils = require('dw/web/URLUtils');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var _require = require('../../../utils/index'),
    clearForms = _require.clearForms;

function handleOrderConfirmation(paymentInstrument, result, order, _ref) {
  var req = _ref.req,
      res = _ref.res,
      next = _ref.next;
  Transaction.begin();
  AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
  order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
  order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
  Transaction.commit();
  COHelpers.sendConfirmationEmail(order, req.locale.id);
  clearForms.clearForms();
  res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
  return next();
}

module.exports = handleOrderConfirmation;