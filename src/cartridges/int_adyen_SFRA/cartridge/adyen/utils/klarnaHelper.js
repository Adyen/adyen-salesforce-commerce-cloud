const OrderMgr = require('dw/order/OrderMgr');
const BasketMgr = require('dw/order/BasketMgr');
const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const setErrorType = require('*/cartridge/adyen/logs/setErrorType');
const clearForms = require('*/cartridge/adyen/utils/clearForms');

/**
 * Checks if the payment instrument in the order contains a Klarna payment
 * @param {dw.order.Order} order - The previous order
 * @returns {boolean} - True if the payment instrument is Klarna
 */
function checkIsKlarnaPayment(order) {
  if (!order) {
    return false;
  }
  const paymentInstruments = order.getPaymentInstruments().toArray();
  if (!paymentInstruments.length) {
    return false;
  }

  return paymentInstruments.some((pi) => {
    if (!pi.custom.adyenPaymentData) {
      return false;
    }
    try {
      const adyenPaymentData = JSON.parse(pi.custom.adyenPaymentData);
      return adyenPaymentData.paymentMethod?.type?.includes('klarna') || false;
    } catch (error) {
      AdyenLogs.error_log(
        'Error parsing adyenPaymentData in checkIsKlarnaPayment: ',
        error,
      );
      return false;
    }
  });
}

function recreateBasketAfterKlarnaPayment(req, res, next) {
  try {
    if (session.privacy.orderNo) {
      const order = OrderMgr.getOrder(session.privacy.orderNo);
      const isKlarnaPayment = checkIsKlarnaPayment(order);
      if (isKlarnaPayment) {
        Transaction.wrap(() => {
          OrderMgr.failOrder(order, true);
          session.privacy.orderNo = null;
          session.privacy.partialPaymentAmounts = null;
          const currentBasket = BasketMgr.getCurrentBasket();
          clearForms.clearAdyenBasketData(currentBasket);
        });
      }
    }
    return next();
  } catch (e) {
    AdyenLogs.fatal_log('Error occurred:', e.message);
    setErrorType(e, res);
    return res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  }
}

module.exports = {
  checkIsKlarnaPayment,
  recreateBasketAfterKlarnaPayment,
};
