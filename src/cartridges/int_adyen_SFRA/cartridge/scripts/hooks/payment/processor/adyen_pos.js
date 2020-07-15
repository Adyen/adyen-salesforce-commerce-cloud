/**
 *
 */

const server = require('server');
const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const Logger = require('dw/system/Logger');
const collections = require('*/cartridge/scripts/util/collections');
const constants = require('*/cartridge/adyenConstants/constants');

function Handle(basket /* , paymentInformation */) {
  Transaction.wrap(function () {
    collections.forEach(basket.getPaymentInstruments(), function (item) {
      basket.removePaymentInstrument(item);
    });

    const paymentInstrument = basket.createPaymentInstrument(
      constants.METHOD_ADYEN_POS,
      basket.totalGrossPrice,
    );
    paymentInstrument.custom.adyenPaymentMethod = 'POS Terminal';
  });

  return { error: false };
}

/**
 * Authorize
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
  let errors;
  const adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');
  Transaction.wrap(function () {
    paymentInstrument.paymentTransaction.transactionID = orderNumber;
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
  });

  const adyenPaymentForm = server.forms.getForm('billing').adyenPaymentFields;
  const OrderMgr = require('dw/order/OrderMgr');
  const order = OrderMgr.getOrder(orderNumber);
  const terminalId = adyenPaymentForm.terminalId.value;

  if (!terminalId) {
    Logger.getLogger('Adyen').error('No terminal selected');
    errors = [];
    errors.push(
      Resource.msg('error.payment.processor.not.supported', 'checkout', null),
    );
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
    Logger.getLogger('Adyen').error(
      `POS Authorise error, result: ${result.response}`,
    );
    errors = [];
    errors.push(
      Resource.msg('error.payment.processor.not.supported', 'checkout', null),
    );
    return {
      authorized: false,
      fieldErrors: [],
      serverErrors: errors,
      error: true,
    };
  }
  return result;
}

exports.Handle = Handle;
exports.Authorize = Authorize;
