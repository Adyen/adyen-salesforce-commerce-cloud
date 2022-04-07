"use strict";

var middlewares = require('./middlewares/index');

function Handle(basket) {
  return middlewares.posHandle(basket);
}
/**
 * Authorize
 */


function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
  return middlewares.posAuthorize(orderNumber, paymentInstrument, paymentProcessor);
}

exports.Handle = Handle;
exports.Authorize = Authorize;