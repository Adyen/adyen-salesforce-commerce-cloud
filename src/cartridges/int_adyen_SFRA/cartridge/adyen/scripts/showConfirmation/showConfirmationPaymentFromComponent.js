const OrderMgr = require('dw/order/OrderMgr');
const BasketMgr = require('dw/order/BasketMgr');
const URLUtils = require('dw/web/URLUtils');
const handlePayment = require('*/cartridge/adyen/scripts/showConfirmation/handlePaymentFromComponent');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const setErrorType = require('*/cartridge/adyen/logs/setErrorType');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const {
  checkIsKlarnaPayment,
} = require('*/cartridge/adyen/utils/klarnaHelper');

/*
 * Show confirmation for payments completed from component directly e.g. paypal, QRcode, ..
 */
function showConfirmationPaymentFromComponent(req, res, next) {
  const options = { req, res, next };
  try {
    session.privacy.giftCardResponse = null;
    const stateData = JSON.parse(req.form.additionalDetailsHidden);
    const currentBasket = BasketMgr.getCurrentBasket();

    const isKlarnaWidgetEnabled = AdyenConfigs.getKlarnaInlineWidgetEnabled();
    const isKlarnaPayment = checkIsKlarnaPayment(currentBasket);

    let order;
    if (isKlarnaPayment && isKlarnaWidgetEnabled) {
      order = AdyenHelper.createOrder(currentBasket);
    } else {
      order = OrderMgr.getOrder(
        req.form.merchantReference,
        req.form.orderToken,
      );
    }

    return handlePayment(stateData, order, options);
  } catch (error) {
    AdyenLogs.error_log('Could not verify /payment/details', error);
    setErrorType(error, res, {
      redirectUrl: URLUtils.url('Error-ErrorCode', 'err', 'general').toString(),
    });
    return next();
  }
}

module.exports = showConfirmationPaymentFromComponent;
