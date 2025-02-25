"use strict";

var middlewares = require('*/cartridge/adyen/scripts/hooks/payment/processor/middlewares/index');
function Handle(basket) {
  return middlewares.posHandle(basket);
}

/**
 * Authorize
 */
function Authorize(order, paymentInstrument, paymentProcessor) {
  return middlewares.posAuthorize(order, paymentInstrument, paymentProcessor);
}
exports.Handle = Handle;
exports.Authorize = Authorize;