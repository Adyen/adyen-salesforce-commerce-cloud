const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const { clearForms } = require('../../../utils/index');
const { handlePlaceOrderError } = require('./errorHandler');

function handleOrderConfirm(
  paymentInstrument,
  order,
  result,
  { req, res, next },
) {
  Transaction.begin();
  AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
  order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
  order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
  Transaction.commit();
  COHelpers.sendConfirmationEmail(order, req.locale.id);
  clearForms.clearForms();

  // determines SFRA version for backwards compatibility
  if (AdyenHelper.getAdyenSFRA6Compatibility() === true) {
    res.render('orderConfirmForm', {
      orderID: order.orderNo,
      orderToken: order.orderToken,
    });
  } else {
    res.redirect(
      URLUtils.url(
        'Order-Confirm',
        'ID',
        order.orderNo,
        'token',
        order.orderToken,
      ).toString(),
    );
  }
  return next();
}

function handlePlaceOrder(paymentInstrument, order, result, options) {
  // custom fraudDetection
  const fraudDetectionStatus = { status: 'success' };

  // Places the order
  const placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
  if (placeOrderResult.error) {
    return handlePlaceOrderError(order, options);
  }

  return handleOrderConfirm(paymentInstrument, order, result, options);
}

module.exports = handlePlaceOrder;
