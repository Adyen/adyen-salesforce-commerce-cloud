const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const { clearForms } = require('*/cartridge/controllers/utils/index');

function handleOrderConfirm(
  adyenPaymentInstrument,
  result,
  order,
  orderModel,
  { res, next },
) {
  Transaction.wrap(() => {
    order.custom.Adyen_CustomerEmail = JSON.stringify(orderModel);
    AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
  });

  clearForms.clearForms();
  // determines SFRA version for backwards compatibility
  if (AdyenConfigs.getAdyenSFRA6Compatibility() === true) {
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

module.exports = handleOrderConfirm;
