const server = require('server');
const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

/**
 * Authorize
 */
function posAuthorize(order, paymentInstrument, paymentProcessor) {
  Transaction.wrap(() => {
    paymentInstrument.paymentTransaction.transactionID = order.orderNo;
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
  });

  const adyenPaymentForm = server.forms.getForm('billing').adyenPaymentFields;
  const terminalId = adyenPaymentForm.terminalId.value;

  if (!terminalId) {
    AdyenLogs.fatal_log('No terminal selected');
    const errors = [
      Resource.msg('error.payment.processor.not.supported', 'checkout', null),
    ];
    return {
      authorized: false,
      fieldErrors: [],
      serverErrors: errors,
      error: true,
    };
  }

  const result = adyenTerminalApi.createTerminalPayment(
    order,
    paymentInstrument,
    terminalId,
  );
  if (result.error) {
    AdyenLogs.fatal_log(`POS Authorise error, result: ${result.response}`);
    const errors = [
      Resource.msg('error.payment.processor.not.supported', 'checkout', null),
    ];
    return {
      authorized: false,
      fieldErrors: [],
      serverErrors: errors,
      error: true,
    };
  }
  return result;
}

module.exports = posAuthorize;
