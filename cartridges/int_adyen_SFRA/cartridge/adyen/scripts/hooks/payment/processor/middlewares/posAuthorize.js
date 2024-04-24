"use strict";

var server = require('server');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var adyenTerminalApi = require('*/cartridge/adyen/scripts/payments/adyenTerminalApi');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

/**
 * Authorize
 */
function posAuthorize(order, paymentInstrument, paymentProcessor) {
  Transaction.wrap(function () {
    paymentInstrument.paymentTransaction.transactionID = order.orderNo;
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
  });
  var adyenPaymentForm = server.forms.getForm('billing').adyenPaymentFields;
  var terminalId = adyenPaymentForm.terminalId.value;
  if (!terminalId) {
    AdyenLogs.fatal_log('No terminal selected');
    var errors = [Resource.msg('error.payment.processor.not.supported', 'checkout', null)];
    return {
      authorized: false,
      fieldErrors: [],
      serverErrors: errors,
      error: true
    };
  }
  var result = adyenTerminalApi.createTerminalPayment(order, paymentInstrument, terminalId);
  if (result.error) {
    AdyenLogs.fatal_log("POS Authorise error, result: ".concat(result.response));
    var _errors = [Resource.msg('error.payment.processor.not.supported', 'checkout', null)];
    return {
      authorized: false,
      fieldErrors: [],
      serverErrors: _errors,
      error: true
    };
  }
  return result;
}
module.exports = posAuthorize;