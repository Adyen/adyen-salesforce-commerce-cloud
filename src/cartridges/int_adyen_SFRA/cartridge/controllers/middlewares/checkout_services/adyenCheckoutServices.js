const constants = require('*/cartridge/adyenConstants/constants');
const collections = require('*/cartridge/scripts/util/collections');

function processPayment(order, handlePaymentResult, req, res, emit) {
  res.json({
    error: false,
    adyenAction: handlePaymentResult.action,
    orderID: order.orderNo,
    orderToken: order.orderToken,
  });
  emit('route:Complete');
}

function isAdyen(currentBasket, next) {
  let isAdyenBool = false;

  collections.forEach(
    currentBasket.getPaymentInstruments(),
    (paymentInstrument) => {
      if (
        [
          constants.METHOD_ADYEN,
          paymentInstrument.METHOD_CREDIT_CARD,
          constants.METHOD_ADYEN_POS,
          constants.METHOD_ADYEN_COMPONENT,
        ].indexOf(paymentInstrument.paymentMethod) !== -1
      ) {
        isAdyenBool = true;
      }
    },
  );

  if (!isAdyenBool) {
    return next();
  }
  return false;
}

module.exports = {
  processPayment,
  isAdyen,
};
