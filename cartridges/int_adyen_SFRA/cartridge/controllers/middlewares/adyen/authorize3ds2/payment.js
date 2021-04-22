"use strict";

var URLUtils = require('dw/web/URLUtils');

var Transaction = require('dw/system/Transaction');

var Logger = require('dw/system/Logger');

var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

var _require = require('../../../utils/index'),
    clearForms = _require.clearForms;

var _require2 = require('./errorHandler'),
    handlePaymentError = _require2.handlePaymentError;

var handlePlaceOrder = require('./order');

function checkForSuccessfulPayment(result) {
  var hasError = result.error;
  var isAuthorised = result.resultCode === 'Authorised';
  var authorisedSuccessfully = !hasError && isAuthorised;
  var isAction = result.action;
  return authorisedSuccessfully || isAction;
}

function handleAction(orderNo, _ref) {
  var res = _ref.res,
      next = _ref.next;
  res.redirect(URLUtils.url('Adyen-Adyen3DS2', 'orderNo', orderNo));
  return next();
}

function checkForValidRequest(result, order, paymentInstrument, options) {
  var res = options.res,
      next = options.next; // If invalid payments/details call, return back to home page

  if (result.invalidRequest) {
    Logger.getLogger('Adyen').error("Invalid request for order ".concat(order.orderNo));
    res.redirect(URLUtils.httpHome());
    return next();
  }

  var isValid = checkForSuccessfulPayment(result);

  if (!isValid) {
    // Payment failed
    return handlePaymentError(order, paymentInstrument, options);
  }

  return true;
} // eslint-disable-next-line consistent-return


function handlePaymentsDetailsCall(paymentDetailsRequest, order, paymentInstrument, options) {
  var result = adyenCheckout.doPaymentDetailsCall(paymentDetailsRequest);
  var isValid = checkForValidRequest(result, order, paymentInstrument, options);

  if (isValid) {
    var orderNo = result.merchantReference || order.orderNo;

    if (result.action) {
      // Redirect to ChallengeShopper
      Transaction.wrap(function () {
        paymentInstrument.custom.adyenAction = JSON.stringify(result.action);
      });
      return handleAction(orderNo, options);
    }

    clearForms.clearAdyenData(paymentInstrument);
    return handlePlaceOrder(paymentInstrument, order, result, options);
  }
}

module.exports = handlePaymentsDetailsCall;