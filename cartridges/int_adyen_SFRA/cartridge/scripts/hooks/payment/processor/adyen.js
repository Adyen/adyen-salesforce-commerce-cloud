/**
 *
 */

'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var Logger = require('dw/system/Logger');

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
    Logger.getLogger("Adyen").error("paymentMethodType = " + paymentInformation.paymentMethodType);
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

    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderNumber);

    var adyenCheckout = require('int_adyen_overlay/cartridge/scripts/adyenCheckout');
    Transaction.begin();

    var result = adyenCheckout.alternativePaymentMethod({
        Order: order,
        Amount: paymentInstrument.paymentTransaction.amount,
        CurrentSession: session,
        CurrentRequest: request,
        PaymentInstrument: paymentInstrument,
        PaymentType: "ideal",
        IssuerId: "1121"
    });

    if (result.error) {
        var errors = [];
        errors.push(Resource.msg('error.payment.processor.not.supported', 'checkout', null));
        return {
            authorized: false, fieldErrors: [], serverErrors: errors, error: true
        };
    }
    if (result.resultCode == 'RedirectShopper') {
        return { authorized: false, error: true };
        Transaction.wrap(function () {
            paymentInstrument.custom.adyenPaymentData = result.PaymentData;
        });
        // session.custom.order = order;
        // session.custom.paymentInstrument = paymentInstrument;
        // return {
        //     authorized: true,
        //     authorized3d: true,
        //     order: order,
        //     paymentInstrument: paymentInstrument,
        //     redirectObject : result.RedirectObject
        // };
    }

    return { authorized: true, error: false };
}

exports.Handle = Handle;
exports.Authorize = Authorize;
