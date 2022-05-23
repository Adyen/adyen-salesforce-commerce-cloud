"use strict";

var server = require('server');

var Resource = require('dw/web/Resource');

var Transaction = require('dw/system/Transaction');

var Logger = require('dw/system/Logger');

var adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');
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
    Logger.getLogger('Adyen').error('No terminal selected');
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
    Logger.getLogger('Adyen').error("POS Authorise error, result: ".concat(result.response));
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