var Status = require('dw/system/Status');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Logger = require('dw/system/Logger');

exports.authorizeOrderPayment = function (order) {
    order.addNote('Payment Authorization Warning!', 'This is a dummy \
authorizeOrderPayment hook implementation. Please disable it to use \
the built-in PSP API, or implement the necessary calls to the \
Payment Provider for authorization.');
    var paymentInstruments = order.getPaymentInstruments(
        PaymentInstrument.METHOD_DW_APPLE_PAY).toArray();
    if (!paymentInstruments.length) {
        Logger.error('Unable to find Apple Pay payment instrument for order.');
        return null;
    }
    var paymentInstrument = paymentInstruments[0];
    var paymentTransaction = paymentInstrument.getPaymentTransaction();
    paymentTransaction.setTransactionID('DUMMY-APPLEPAY-PSP-TRANSACTION-ID');
    return new Status(Status.OK);
};
