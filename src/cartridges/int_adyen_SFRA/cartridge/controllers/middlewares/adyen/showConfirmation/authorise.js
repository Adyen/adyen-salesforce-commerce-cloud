const Locale = require('dw/util/Locale');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const OrderModel = require('*/cartridge/models/order');
const handleOrderConfirm = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/order');
const payment = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/payment');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

function handleAuthorised(
  adyenPaymentInstrument,
  detailsResult,
  order,
  options,
) {
  const { req } = options;

  // custom fraudDetection
  const fraudDetectionStatus = { status: 'success' };

  // Places the order
  const placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
  if (placeOrderResult.error) {
    return payment.handlePaymentError(order, 'placeOrder', options);
  }
  const currentLocale = Locale.getLocale(req.locale.id);
  const orderModel = new OrderModel(order, {
    countryCode: currentLocale.country,
  });

  AdyenLogs.info_log(`Order status: ${order.getStatus().getDisplayValue()}`,);
  // Save orderModel to custom object during session
  return handleOrderConfirm(
    adyenPaymentInstrument,
    detailsResult,
    order,
    orderModel,
    options,
  );
}

module.exports = handleAuthorised;
