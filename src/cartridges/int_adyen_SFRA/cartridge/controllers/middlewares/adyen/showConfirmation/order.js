const Transaction = require('dw/system/Transaction');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const { clearForms } = require('../../../utils/index');

function handleOrderConfirm(
  order,
  orderModel,
  adyenPaymentInstrument,
  result,
  { res, next },
) {
  Transaction.wrap(() => {
    order.custom.Adyen_CustomerEmail = JSON.stringify(orderModel);
    AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
  });

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

module.exports = handleOrderConfirm;
