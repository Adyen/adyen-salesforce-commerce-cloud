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
      if(session.custom.adyenIssuerName){
          paymentInstrument.custom.adyenIssuerName = session.custom.adyenIssuerName;
      }

  });

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
        PaymentType: session.custom.paymentType,
        Issuer: session.custom.issuer
    });
    if (result.error) {
        var errors = [];
        errors.push(Resource.msg('error.payment.processor.not.supported', 'checkout', null));
        return {
            authorized: false, fieldErrors: [], serverErrors: errors, error: true
        };
    }

    if (result.ResultCode == 'RedirectShopper') {
        Transaction.wrap(function () {
            paymentInstrument.custom.adyenPaymentData = result.PaymentData;
        });

        return {
            authorized: true,
            order: order,
            paymentInstrument: paymentInstrument,
            redirectObject : result.RedirectObject
        };
    }
    else if(result.ResultCode == 'Authorised' || result.ResultCode == 'Pending'){
        return { authorized: true, error: false };
    }
    else {
        Logger.getLogger("Adyen").error("Payment failed, result: " + JSON.stringify(result));
        return {
            authorized: false, error: true
        };
    }
}

exports.Handle = Handle;
exports.Authorize = Authorize;
