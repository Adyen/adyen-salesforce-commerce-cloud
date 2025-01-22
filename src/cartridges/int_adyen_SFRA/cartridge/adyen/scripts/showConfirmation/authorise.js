const handleOrderConfirm = require('*/cartridge/adyen/scripts/showConfirmation/order');

function handleAuthorised(
  adyenPaymentInstrument,
  detailsResult,
  order,
  options,
) {
  // custom fraudDetection
  //   const fraudDetectionStatus = { status: 'success' };

  // Places the order
  //   const placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
  //   if (placeOrderResult.error) {
  //     return payment.handlePaymentError(order, 'placeOrder', options);
  //   }
  return handleOrderConfirm(
    adyenPaymentInstrument,
    detailsResult,
    order,
    options,
  );
}

module.exports = handleAuthorised;
