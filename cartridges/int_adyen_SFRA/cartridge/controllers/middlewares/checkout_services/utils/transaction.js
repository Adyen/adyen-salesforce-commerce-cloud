"use strict";

var Resource = require('dw/web/Resource');

var Transaction = require('dw/system/Transaction');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

var _require = require('*/cartridge/controllers/middlewares/checkout_services/helpers/index'),
    checkForErrors = _require.checkForErrors;

var handleTransaction = function handleTransaction(currentBasket, _ref, emit) {
  var res = _ref.res,
      req = _ref.req;

  var calculatePaymentTransaction = function calculatePaymentTransaction() {
    var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(currentBasket);

    if (calculatedPaymentTransactionTotal.error) {
      res.json({
        error: true,
        errorMessage: Resource.msg('error.technical', 'checkout', null)
      });
      emit('route:Complete');
    }

    return !calculatedPaymentTransactionTotal.error;
  };

  var hasError = checkForErrors(currentBasket, res, req, emit);

  if (hasError) {
    return false;
  } // Calculate the basket


  Transaction.wrap(function () {
    basketCalculationHelpers.calculateTotals(currentBasket);
  });
  return calculatePaymentTransaction();
};

module.exports = handleTransaction;