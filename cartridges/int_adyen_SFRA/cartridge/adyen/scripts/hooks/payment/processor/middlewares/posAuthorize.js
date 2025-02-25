"use strict";

var server = require('server');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var adyenTerminalApi = require('*/cartridge/adyen/scripts/pos/adyenTerminalApi');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

/**
 * Authorize
 */
function posAuthorize(order, paymentInstrument, paymentProcessor) {
  try {
    Transaction.wrap(function () {
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });
    var adyenPaymentForm = server.forms.getForm('billing').adyenPaymentFields;
    var terminalId = adyenPaymentForm === null || adyenPaymentForm === void 0 ? void 0 : adyenPaymentForm.terminalId.value;
    if (!terminalId) {
      throw new Error('No terminal selected');
    }
    return adyenTerminalApi.createTerminalPayment(order, paymentInstrument, terminalId);
  } catch (error) {
    AdyenLogs.fatal_log('POS Authorise error', error);
    var errors = [Resource.msg('error.payment.processor.not.supported', 'checkout', null)];
    return {
      authorized: false,
      fieldErrors: [],
      serverErrors: errors,
      error: true
    };
  }
}
module.exports = posAuthorize;