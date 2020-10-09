const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const { handlePaymentError } = require('./errorHandler');
const handlePlaceOrder = require('./order');

function checkForSuccessfulPayment(result) {
  const hasError = result.error;
  const isAuthorised = result.resultCode === 'Authorised';
  const authorisedSuccessfully = !hasError && isAuthorised;
  const isAction = result.action;
  return authorisedSuccessfully || isAction;
}

function handleAction(orderNo, { res, next }) {
  res.redirect(URLUtils.url('Adyen-Adyen3DS2', 'orderNo', orderNo));
  return next();
}

function handlePaymentsDetailsCall(
  paymentDetailsRequest,
  order,
  paymentInstrument,
  options,
) {
  const result = adyenCheckout.doPaymentDetailsCall(paymentDetailsRequest);
  const isValid = checkForSuccessfulPayment(result);
  if (!isValid) {
    // Payment failed
    return handlePaymentError(order, paymentInstrument, options);
  }
  const orderNo = result.merchantReference || order.orderNo;
  if (result.action) {
    // Redirect to ChallengeShopper
    Transaction.wrap(() => {
      paymentInstrument.custom.adyenAction = JSON.stringify(result.action);
    });
    return handleAction(orderNo, options);
  }

  // delete paymentData from requests
  Transaction.wrap(() => {
    paymentInstrument.custom.adyenPaymentData = null;
    paymentInstrument.custom.adyenAction = null;
  });
  return handlePlaceOrder(paymentInstrument, order, result, options);
}

module.exports = handlePaymentsDetailsCall;
