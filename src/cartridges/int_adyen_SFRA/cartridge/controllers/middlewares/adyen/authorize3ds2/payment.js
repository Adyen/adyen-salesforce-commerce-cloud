const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const { handlePaymentError } = require('./errorHandler');
const handlePlaceOrder = require('./order');

function checkForSuccessfulPayment(result) {
  const hasError = result.error;
  const isAuthorised = result.resultCode === 'Authorised';
  const authorisedSuccessfully = !hasError && isAuthorised;
  const isChallengeShopper = result.resultCode === 'ChallengeShopper';

  return authorisedSuccessfully || isChallengeShopper;
}

function handleChallengeShopper(result, { res, next }) {
  res.redirect(
    URLUtils.url(
      'Adyen-Adyen3DS2',
      'resultCode',
      result.resultCode,
      'token3ds2',
      result.authentication['threeds2.challengeToken'],
    ),
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
  if (result.resultCode === 'ChallengeShopper') {
    // Redirect to ChallengeShopper
    return handleChallengeShopper(result, options);
  }

  // delete paymentData from requests
  Transaction.wrap(() => {
    paymentInstrument.custom.adyenPaymentData = null;
  });
  return handlePlaceOrder(paymentInstrument, order, result, options);
}

module.exports = handlePaymentsCall;
