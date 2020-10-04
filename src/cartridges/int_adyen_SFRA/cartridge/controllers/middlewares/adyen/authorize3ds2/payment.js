const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const { handlePaymentError } = require('./errorHandler');
const handlePlaceOrder = require('./order');
const Logger = require('dw/system/Logger');

function checkForSuccessfulPayment(result) {
  const hasError = result.error;
  const isAuthorised = result.resultCode === 'Authorised';
  const authorisedSuccessfully = !hasError && isAuthorised;
  const isAction = result.action;

  return authorisedSuccessfully || isAction;
}

function handleAction(result, { res, next }) {
  res.redirect(
    URLUtils.url('Adyen-Adyen3DS2', 'action', JSON.stringify(result.action)),
  );
  return next();
}

function handlePaymentsCall(
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
  if (result.action) {
    // Redirect to ChallengeShopper
    return handleAction(result, options);
  }

  // delete paymentData from requests
  Transaction.wrap(() => {
    paymentInstrument.custom.adyenPaymentData = null;
  });
  return handlePlaceOrder(paymentInstrument, order, result, options);
}

module.exports = handlePaymentsCall;
