const middlewares = require('*/cartridge/scripts/hooks/payment/processor/middlewares/index');

function Handle(basket) {
  return middlewares.posHandle(basket);
}

/**
 * Authorize
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
  return middlewares.posAuthorize(
    orderNumber,
    paymentInstrument,
    paymentProcessor,
  );
}

exports.Handle = Handle;
exports.Authorize = Authorize;
