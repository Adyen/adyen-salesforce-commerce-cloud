const server = require('server');
const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const adyenTerminalApi = require('*/cartridge/adyen/scripts/pos/adyenTerminalApi');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

/**
 * Authorize
 */
function posAuthorize(order, paymentInstrument, paymentProcessor) {
  try {
    Transaction.wrap(() => {
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    const adyenPaymentForm = server.forms.getForm('billing').adyenPaymentFields;
    const terminalId = adyenPaymentForm?.terminalId.value;

    if (!terminalId) {
      throw new Error('No terminal selected');
    }
    return adyenTerminalApi.createTerminalPayment(
      order,
      paymentInstrument,
      terminalId,
    );
  } catch (error) {
    AdyenLogs.fatal_log('POS Authorise error', error);
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
}

module.exports = posAuthorize;
