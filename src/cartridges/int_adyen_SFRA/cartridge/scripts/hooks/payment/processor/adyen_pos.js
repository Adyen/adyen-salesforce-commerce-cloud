const middlewares = require('./middlewares/index');

function Handle(basket) {
  return middlewares.pos_handle(basket);
}

/**
 * Authorize
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
  return middlewares.pos_authorize(
    orderNumber,
    paymentInstrument,
    paymentProcessor,
  );
}

exports.Handle = Handle;
exports.Authorize = Authorize;
