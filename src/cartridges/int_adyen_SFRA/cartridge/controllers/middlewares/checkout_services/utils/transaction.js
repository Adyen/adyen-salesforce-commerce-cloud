const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
const { checkForErrors } = require('../helpers/index');

const handleTransaction = (currentBasket, { res, req }, emit) => {
  // const validatePayment = () => {
  //   // Re-validates existing payment instruments
  //   const validPayment = adyenHelpers.validatePayment(req, currentBasket);
  //   if (validPayment.error) {
  //     res.json({
  //       error: true,
  //       errorStage: {
  //         stage: 'payment',
  //         step: 'paymentInstrument',
  //       },
  //       errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null),
  //     });
  //     emit('route:Complete');
  //   }
  //   return !validPayment.error;
  // };

  const calculatePaymentTransaction = () => {
    const calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(
      currentBasket,
    );
    if (calculatedPaymentTransactionTotal.error) {
      res.json({
        error: true,
        errorMessage: Resource.msg('error.technical', 'checkout', null),
      });
      emit('route:Complete');
    }
    return !calculatedPaymentTransactionTotal.error;
  };

  const hasError = checkForErrors(currentBasket, res, req, emit);
  if (hasError) {
    return false;
  }

  // Calculate the basket
  Transaction.wrap(() => {
    basketCalculationHelpers.calculateTotals(currentBasket);
  });

  // return validatePayment() && calculatePaymentTransaction();
  return calculatePaymentTransaction();
};

module.exports = handleTransaction;
