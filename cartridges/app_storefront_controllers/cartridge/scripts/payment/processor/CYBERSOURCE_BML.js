'use strict';

/* API Includes */
var Cart = require('~/cartridge/scripts/models/CartModel');
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');

/**
 * This is where additional BillMeLaterl integration would go. The current implementation simply creates a payment
 * method and returns 'success'.
 */
function Handle(args) {
    var cart = Cart.get(args.Basket);

    if (!session.forms.billing.paymentMethods.bml.termsandconditions.checked) {
        session.forms.billing.paymentMethods.bml.termsandconditions.invalidateFormElement();
        return {error: true};
    } else {
        Transaction.wrap(function () {
            cart.removeExistingPaymentInstruments(dw.order.PaymentInstrument.METHOD_BML);
            cart.createPaymentInstrument(dw.order.PaymentInstrument.METHOD_BML, cart.getNonGiftCertificateAmount());
        });

        return {sucess: true};
    }
}

/**
 * Authorizes a payment using a credit card. The payment is authorized by using the CYBERSOURCE_BML processor only and
 * setting the order no as the transaction ID. Customizations may use other processors and custom logic to authorize
 * credit card payment.
 */
function Authorize(args) {
    var orderNo = args.OrderNo;
    var paymentInstrument = args.PaymentInstrument;
    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();

    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.transactionID = orderNo;
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    return {authorized: true};
}

/*
 * Module exports
 */

/*
 * Local methods
 */
exports.Handle = Handle;
exports.Authorize = Authorize;
