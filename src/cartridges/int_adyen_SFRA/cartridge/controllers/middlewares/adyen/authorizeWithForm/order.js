const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const { clearForms } = require('../../../utils/index');

function handleOrderConfirmation(
  paymentInstrument,
  result,
  order,
  { req, res, next },
) {
  Transaction.begin();
  AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
  order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
  order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
  Transaction.commit();
  COHelpers.sendConfirmationEmail(order, req.locale.id);
  clearForms.clearForms();
  // TODO determine SFRA version for backwards compatibility
  // res.redirect(
  //   URLUtils.url(
  //     'Order-Confirm',
  //     'ID',
  //     order.orderNo,
  //     'token',
  //     order.orderToken,
  //   ).toString(),
  // );
  res.render('orderConfirmForm', {
    orderID: order.orderNo,
    orderToken: order.orderToken,
  });
  return next();
}

module.exports = handleOrderConfirmation;
