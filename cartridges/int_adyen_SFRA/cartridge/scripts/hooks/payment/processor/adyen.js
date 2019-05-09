/**
 *
 */

'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Transaction = require('dw/system/Transaction');

function Handle(basket, paymentInformation) {
  Transaction.wrap(function () {
    collections.forEach(basket.getPaymentInstruments(), function (item) {
      basket.removePaymentInstrument(item);
    });

    var paymentInstrument = basket.createPaymentInstrument(
      'Adyen', basket.totalGrossPrice
    );
      paymentInstrument.custom.adyenPaymentMethod = session.custom.adyenPaymentMethod;
      paymentInstrument.custom.adyenIssuerName = session.custom.adyenIssuerName;
  });

  return { error: false };
}

/**
 * Authorizes a payment using a Adyen.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */

function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
  Transaction.wrap(function () {
    paymentInstrument.paymentTransaction.transactionID = orderNumber;
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
  });
    return { authorized: true, error: false };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
