"use strict";

var Transaction = require('dw/system/Transaction');

var URLUtils = require('dw/web/URLUtils');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var _require = require('*/cartridge/controllers/utils/index'),
    clearForms = _require.clearForms;

var _require2 = require('*/cartridge/controllers/middlewares/adyen/authorize3ds2/errorHandler'),
    handlePlaceOrderError = _require2.handlePlaceOrderError;

function handleOrderConfirm(paymentInstrument, order, result, _ref) {
  var req = _ref.req,
      res = _ref.res,
      next = _ref.next;
  Transaction.begin();
  AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
  order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
  order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
  Transaction.commit();
  COHelpers.sendConfirmationEmail(order, req.locale.id);
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

function handlePlaceOrder(paymentInstrument, order, result, options) {
  // custom fraudDetection
  var fraudDetectionStatus = {
    status: 'success'
  }; // Places the order

  var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);

  if (placeOrderResult.error) {
    return handlePlaceOrderError(order, options);
  }

  return handleOrderConfirm(paymentInstrument, order, result, options);
}

module.exports = handlePlaceOrder;