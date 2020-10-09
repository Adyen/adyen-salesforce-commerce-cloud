const OrderMgr = require('dw/order/OrderMgr');
const Transaction = require('dw/system/Transaction');
const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const constants = require('*/cartridge/adyenConstants/constants');
const handleError = require('./error');
const handleInvalidPayment = require('./payment');
const handleOrderConfirmation = require('./order');

function authorize(paymentInstrument, order, options) {
  const { req, res } = options;
  const jsonRequest = {
    paymentData: paymentInstrument.custom.adyenPaymentData,
    details: {
      MD: req.form.MD,
      PaRes: req.form.PaRes,
    },
  };
  const result = adyenCheckout.doPaymentDetailsCall(jsonRequest);
  Transaction.wrap(() => {
    paymentInstrument.custom.adyenPaymentData = null;
  });

  // If invalid payments/details call, return back to home page
  if (result.invalidRequest) {
    Logger.getLogger('Adyen').error(
      `Invalid request for order ${order.orderNo}`,
    );
    return res.redirect(URLUtils.httpHome());
  }

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
    : handleOrderConfirmation(paymentInstrument, result, order, options);
}

function handleAuthorize(options) {
  const { req } = options;
  const order = OrderMgr.getOrder(req.querystring.merchantReference);
  const [paymentInstrument] = order
    .getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT)
    .toArray();

  const hasValidMD = paymentInstrument.custom.adyenMD === req.form.MD;
  return hasValidMD
    ? authorize(paymentInstrument, order, options)
    : handleError('Not a valid MD', options);
}

module.exports = handleAuthorize;
