/**
 *
 */

'use strict';
var server = require('server');
var collections = require('*/cartridge/scripts/util/collections');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var Logger = require('dw/system/Logger');
var AdyenHelper = require('*/cartridge/scripts/util/AdyenHelper');
var URLUtils = require('dw/web/URLUtils');

function Handle(basket, paymentInformation) {
    Transaction.wrap(function () {
        collections.forEach(basket.getPaymentInstruments(), function (item) {
            basket.removePaymentInstrument(item);
        });

        var paymentInstrument = basket.createPaymentInstrument(
            'Adyen', basket.totalGrossPrice
        );

        paymentInstrument.custom.adyenPaymentData = paymentInformation.stateData;
        paymentInstrument.custom.adyenPaymentMethod = paymentInformation.adyenPaymentMethod;
        if (paymentInformation.adyenIssuerName) {
            paymentInstrument.custom.adyenIssuerName = paymentInformation.adyenIssuerName;
        }

    });

    return {error: false};
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
    if (!order || !paymentInstrument) {
        Logger.getLogger('Adyen').error('No order or payment instrument present.');
        return {
            authorized: false, fieldErrors: [], serverErrors: errors, error: true
        };
    }
    var adyenPaymentForm = server.forms.getForm('billing').adyenPaymentFields;

    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    Transaction.begin();

    var result = adyenCheckout.createPaymentRequest({
        Order: order,
        PaymentInstrument: paymentInstrument,
        ReturnUrl: URLUtils.https('Adyen-ShowConfirmation').toString(),
        ratePayFingerprint: session.privacy.ratePayFingerprint,
        adyenFingerprint: session.forms.adyPaydata.adyenFingerprint.value,
        adyenForm: adyenPaymentForm

    });
    if (result.error) {
        var errors = [];
        errors.push(Resource.msg('error.payment.processor.not.supported', 'checkout', null));
        return {
            authorized: false, fieldErrors: [], serverErrors: errors, error: true
        };
    }

    if (result.resultCode == 'RedirectShopper') {
        Transaction.commit();
        Transaction.wrap(function () {
            paymentInstrument.custom.adyenPaymentData = result.PaymentData;
        });

        session.privacy.orderNo = order.orderNo;
        var signature = AdyenHelper.getAdyenHash(result.RedirectObject.url, result.PaymentData);

        return {
            authorized: true,
            orderNo: orderNumber,
            paymentInstrument: paymentInstrument,
            redirectObject: result.RedirectObject,
            signature: signature
        };
    } else if (result.resultCode == 'Authorised' || result.resultCode == 'Received' || result.resultCode == 'PresentToShopper') {
        return {authorized: true, error: false};
    } else {
        Logger.getLogger("Adyen").error("Payment failed, result: " + JSON.stringify(result));
        return {
            authorized: false, error: true
        };
    }
}

exports.Handle = Handle;
exports.Authorize = Authorize;
