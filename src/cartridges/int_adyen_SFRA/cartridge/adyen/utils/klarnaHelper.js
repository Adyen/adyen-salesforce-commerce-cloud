const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

/**
 * Checks if the payment instrument in the basket is a Klarna payment
 * @param {dw.order.Basket} basket - The current basket
 * @returns {boolean} - True if the payment instrument is Klarna
 */
function checkIsKlarnaPayment(basket) {
  if (!basket) {
    return false;
  }
  const paymentInstruments = basket.getPaymentInstruments().toArray();
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

module.exports = {
  checkIsKlarnaPayment,
};
