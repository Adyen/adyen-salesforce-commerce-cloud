const OrderMgr = require('dw/order/OrderMgr');
const Order = require('dw/order/Order');
const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const constants = require('*/cartridge/adyenConstants/constants');
const { clearForms } = require('*/cartridge/controllers/utils/index');
const handleError = require('*/cartridge/controllers/middlewares/adyen/authorizeWithForm/error');
const handleInvalidPayment = require('*/cartridge/controllers/middlewares/adyen/authorizeWithForm/payment');
const handleOrderConfirmation = require('*/cartridge/controllers/middlewares/adyen/authorizeWithForm/order');

function checkForValidRequest(result, order, merchantRefOrder, options) {
  const { res, next } = options;
  // If invalid payments/details call, return back to home page
  if (result.invalidRequest) {
    Logger.getLogger('Adyen').error(
      `Invalid request for order ${order.orderNo}`,
    );
    res.redirect(URLUtils.httpHome());
    return next();
  }

  // if error, return to checkout page
  if (result.error || result.resultCode !== constants.RESULTCODES.AUTHORISED) {
    return handleInvalidPayment(merchantRefOrder, 'payment', options);
  }
  return true;
}

// eslint-disable-next-line consistent-return
function authorize(paymentInstrument, order, options) {
  const { req } = options;
  const jsonRequest = {
    details: {
      MD: req.form.MD,
      PaRes: req.form.PaRes,
    },
  };

  if (order.status.value === Order.ORDER_STATUS_FAILED) {
    Logger.getLogger('Adyen').error(
      `Could not call payment/details for failed order ${order.orderNo}`,
    );
    return handleInvalidPayment(order, 'placeOrder', options);
  }
  const result = adyenCheckout.doPaymentsDetailsCall(jsonRequest);
  clearForms.clearAdyenData(paymentInstrument);

  const merchantRefOrder = OrderMgr.getOrder(result.merchantReference);
  const isValid = checkForValidRequest(
    result,
    order,
    merchantRefOrder,
    options,
  );

  if (isValid) {
    // custom fraudDetection
    const fraudDetectionStatus = { status: 'success' };

    // Places the order
    const { error } = COHelpers.placeOrder(
      merchantRefOrder,
      fraudDetectionStatus,
    );
    const orderConfirmationArgs = [
      paymentInstrument,
      result,
      merchantRefOrder,
      options,
    ];
    return error
      ? handleInvalidPayment(merchantRefOrder, 'placeOrder', options)
      : handleOrderConfirmation(...orderConfirmationArgs);
  }
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
