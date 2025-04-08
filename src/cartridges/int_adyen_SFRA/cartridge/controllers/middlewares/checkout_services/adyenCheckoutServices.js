const constants = require('*/cartridge/adyen/config/constants');
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

function isNotAdyen(currentBasket) {
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
  return !isAdyenBool;
}

module.exports = {
  processPayment,
  isNotAdyen,
};
