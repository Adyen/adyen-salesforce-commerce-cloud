const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const Logger = require('dw/system/Logger');
const Order = require('dw/order/Order');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const { clearForms } = require('*/cartridge/controllers/utils/index');
const {
  handlePaymentError,
} = require('*/cartridge/controllers/middlewares/adyen/authorize3ds2/errorHandler');
const handlePlaceOrder = require('*/cartridge/controllers/middlewares/adyen/authorize3ds2/order');
const constants = require('*/cartridge/adyenConstants/constants');

function checkForSuccessfulPayment(result) {
  const hasError = result.error;
  const isAuthorised = result.resultCode === constants.RESULTCODES.AUTHORISED;
  const authorisedSuccessfully = !hasError && isAuthorised;
  const isAction = result.action;
  return authorisedSuccessfully || isAction;
}

function handleAction(orderNo, { res, next }) {
  res.redirect(URLUtils.url('Adyen-Adyen3DS2', 'orderNo', orderNo));
  return next();
}

function checkForValidRequest(result, order, paymentInstrument, options) {
  const { res, next } = options;
  // If invalid payments/details call, return back to home page
  if (result.invalidRequest) {
    Logger.getLogger('Adyen').error(
      `Invalid request for order ${order.orderNo}`,
    );
    res.redirect(URLUtils.httpHome());
    return next();
  }
  const isValid = checkForSuccessfulPayment(result);
  if (!isValid) {
    // Payment failed
    return handlePaymentError(order, paymentInstrument, options);
  }
  return true;
}

// eslint-disable-next-line consistent-return
function handlePaymentsDetailsCall(
  paymentDetailsRequest,
  order,
  paymentInstrument,
  options,
) {
  if (order.status.value === Order.ORDER_STATUS_FAILED) {
    Logger.getLogger('Adyen').error(
      `Could not call payment/details for failed order ${order.orderNo}`,
    );
    return handlePaymentError(order, paymentInstrument, options);
  }

  const result = adyenCheckout.doPaymentsDetailsCall(paymentDetailsRequest);
  const isValid = checkForValidRequest(
    result,
    order,
    paymentInstrument,
    options,
  );

  if (isValid) {
    const orderNo = result.merchantReference || order.orderNo;
    if (result.action) {
      // Redirect to ChallengeShopper
      Transaction.wrap(() => {
        paymentInstrument.custom.adyenAction = JSON.stringify(result.action);
      });
      return handleAction(orderNo, options);
    }
    clearForms.clearAdyenData(paymentInstrument);
    return handlePlaceOrder(paymentInstrument, order, result, options);
  }
}

module.exports = handlePaymentsDetailsCall;
