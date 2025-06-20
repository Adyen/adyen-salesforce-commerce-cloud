const OrderMgr = require('dw/order/OrderMgr');
const BasketMgr = require('dw/order/BasketMgr');
const URLUtils = require('dw/web/URLUtils');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const handlePayment = require('*/cartridge/adyen/scripts/showConfirmation/handlePaymentFromComponent');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const setErrorType = require('*/cartridge/adyen/logs/setErrorType');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');

function createOrder() {
  const currentBasket = BasketMgr.getCurrentBasket();
  if (currentBasket.custom?.adyenGiftCards) {
    const giftCardsOrderNo = currentBasket.custom.adyenGiftCardsOrderNo;
    return OrderMgr.createOrder(currentBasket, giftCardsOrderNo);
  }
  return COHelpers.createOrder(currentBasket);
}

/*
 * Show confirmation for payments completed from component directly e.g. paypal, QRcode, ..
 */
function showConfirmationPaymentFromComponent(req, res, next) {
  const options = { req, res, next };
  try {
    session.privacy.giftCardResponse = null;
    const stateData = JSON.parse(req.form.additionalDetailsHidden);
    const isKlarnaPayment = stateData.paymentMethod?.type.includes('klarna');
    const isKlarnaWidgetEnabled = AdyenConfigs.getKlarnaInlineWidgetEnabled();

    let order;
    if (isKlarnaPayment && isKlarnaWidgetEnabled) {
      order = createOrder();
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
