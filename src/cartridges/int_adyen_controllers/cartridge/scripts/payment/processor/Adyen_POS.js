/* API Includes */
const PaymentMgr = require('dw/order/PaymentMgr');
const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const constants = require('*/cartridge/adyenConstants/constants');
/* Script Modules */
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
require('app_storefront_controllers/cartridge/scripts/app');

/**
 * Creates a Adyen payment instrument for the given basket
 */
function handle(args) {
  const adyenRemovePreviousPI = require('*/cartridge/scripts/adyenRemovePreviousPI');

  Transaction.wrap(() => {
    const result = adyenRemovePreviousPI.removePaymentInstruments(args.Basket);
    if (result.error) {
      return result;
    }

    const paymentInstrument = args.Basket.createPaymentInstrument(
      constants.METHOD_ADYEN_POS,
      args.Basket.totalGrossPrice,
    );
    paymentInstrument.custom.adyenPaymentMethod = 'POS Terminal';
  });

  return { success: true };
}

/**
 * Authorizes a payment using a POS terminal.
 * The payment is authorized by using the Adyen_POS processor only
 * and setting the order no as the transaction ID.
 */
function authorize(args) {
  let errors;
  const adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');
  const order = args.Order;
  const orderNo = args.OrderNo;
  const paymentInstrument = args.PaymentInstrument;
  const paymentProcessor = PaymentMgr.getPaymentMethod(
    paymentInstrument.getPaymentMethod(),
  ).getPaymentProcessor();

  Transaction.wrap(() => {
    paymentInstrument.paymentTransaction.transactionID = orderNo;
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
  });

  const paymentForm = session.forms.adyPaydata;

  const terminalId = paymentForm.terminalId.value;

  if (!terminalId) {
    AdyenLogs.fatal_log('No terminal selected');
    errors = [];
    errors.push(
      Resource.msg('error.payment.processor.not.supported', 'checkout', null),
    );
    return {
      isAdyen: true,
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
    AdyenLogs.fatal_log(
      `POS Authorise error, result: ${result.response}`,
    );
    errors = [];
    errors.push(
      Resource.msg('error.payment.processor.not.supported', 'checkout', null),
    );
    return {
      isAdyen: true,
      authorized: false,
      fieldErrors: [],
      serverErrors: errors,
      error: true,
    };
  }

  result.isAdyen = true;
  return result;
}

exports.Handle = handle;
exports.Authorize = authorize;
