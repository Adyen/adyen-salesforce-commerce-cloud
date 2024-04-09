const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const handleOrderConfirm = require('*/cartridge/adyen/scripts/showConfirmation/order');
const payment = require('*/cartridge/adyen/scripts/showConfirmation/handlePayment');

function handleAuthorised(
  adyenPaymentInstrument,
  detailsResult,
  order,
  options,
) {
  // custom fraudDetection
  const fraudDetectionStatus = { status: 'success' };

  // Places the order
  const placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
  if (placeOrderResult.error) {
    return payment.handlePaymentError(order, 'placeOrder', options);
  }
  return handleOrderConfirm(
    adyenPaymentInstrument,
    detailsResult,
    order,
    options,
  );
}

module.exports = handleAuthorised;
