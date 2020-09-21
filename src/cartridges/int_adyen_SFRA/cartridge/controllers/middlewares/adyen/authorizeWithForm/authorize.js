const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const handleError = require('./error');
const handleInvalidPayment = require('./payment');
const handleOrderConfirmation = require('./order');

function authorize(order, options) {
  const { req } = options;
  const jsonRequest = {
    paymentData: this.custom.adyenPaymentData,
    details: {
      MD: req.form.MD,
      PaRes: req.form.PaRes,
    },
  };
  const result = adyenCheckout.doPaymentDetailsCall(jsonRequest);

  Transaction.wrap(() => {
    this.custom.adyenPaymentData = null;
  });

  // if error, return to checkout page
  if (result.error || result.resultCode !== 'Authorised') {
    return handleInvalidPayment(order, 'payment', options);
  }

  // custom fraudDetection
  const fraudDetectionStatus = { status: 'success' };

  // Places the order
  const { error } = COHelpers.placeOrder(order, fraudDetectionStatus);
  return error
    ? handleInvalidPayment(order, 'placeOrder', options)
    : handleOrderConfirmation(this, result, order, options);
}

function handleAuthorize(options) {
  const { req } = options;
  const order = OrderMgr.getOrder(session.privacy.orderNo);
  const [paymentInstrument] = order
    .getPaymentInstruments(session.privacy.paymentMethod)
    .toArray();

  const hasValidMD = session.privacy.MD === req.form.MD;
  return hasValidMD
    ? authorize.call(paymentInstrument, order, options)
    : handleError('Session variable does not exists', options);
}

module.exports = handleAuthorize;
