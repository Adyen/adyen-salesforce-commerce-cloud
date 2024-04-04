const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const clearForms = require('*/cartridge/adyen/utils/clearForms');

function handleOrderConfirm(
  adyenPaymentInstrument,
  result,
  order,
  { res, next },
) {
  Transaction.wrap(() => {
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
