const Locale = require('dw/util/Locale');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const OrderModel = require('*/cartridge/models/order');
const handleOrderConfirm = require('./order');
const payment = require('./payment');

function handleAuthorised(order, result, adyenPaymentInstrument, options) {
  const { req } = options;
  if (
    result.resultCode === 'Received' &&
    result.paymentMethod.indexOf('alipay_hk') > -1
  ) {
    return payment.handleReceived(order, result, options);
  }

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

  // Save orderModel to custom object during session
  return handleOrderConfirm(
    order,
    orderModel,
    adyenPaymentInstrument,
    result,
    options,
  );
}

module.exports = handleAuthorised;
