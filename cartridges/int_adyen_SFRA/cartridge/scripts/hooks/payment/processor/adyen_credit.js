/**
 *
 */

'use strict';

var server = require('server');
var collections = require('*/cartridge/scripts/util/collections');
var PaymentInstrument = require('dw/order/PaymentInstrument');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var AdyenHelper = require('*/cartridge/scripts/util/AdyenHelper');
var URLUtils = require('dw/web/URLUtils');
var Logger = require('dw/system/Logger');

function Handle(basket, paymentInformation) {
    var currentBasket = basket;
    var cardErrors = {};
    var serverErrors = [];
    var sfccCardType = AdyenHelper.getSFCCCardType(paymentInformation.cardType);
    var tokenID = AdyenHelper.getCardToken(paymentInformation.storedPaymentUUID, customer);
    Transaction.wrap(function () {
        collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        var paymentInstrument = currentBasket.createPaymentInstrument(
            PaymentInstrument.METHOD_CREDIT_CARD, currentBasket.totalGrossPrice
        );

        paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
        paymentInstrument.setCreditCardType(sfccCardType);
        paymentInstrument.custom.adyenPaymentData = paymentInformation.stateData;

        if (tokenID) {
            paymentInstrument.setCreditCardExpirationMonth(paymentInformation.expirationMonth.value);
            paymentInstrument.setCreditCardExpirationYear(paymentInformation.expirationYear.value)
            // paymentInstrument.setCreditCardType(paymentInformation.cardType.value);
            paymentInstrument.setCreditCardToken(tokenID);
        }
    });
    return {fieldErrors: cardErrors, serverErrors: serverErrors, error: false};
}

/**
 * Authorizes a payment using a credit card. Customizations may use other processors and custom
 *      logic to authorize credit card payment.
 * @param {number} orderNumber - The current order's number
 * @param {dw.order.PaymentInstrument} paymentInstrument -  The payment instrument to authorize
 * @param {dw.order.PaymentProcessor} paymentProcessor -  The payment processor of the current
 *      payment method
 * @return {Object} returns an error object
 */
function Authorize(orderNumber, paymentInstrument, paymentProcessor) {
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var order = OrderMgr.getOrder(orderNumber);
    if (!order || !paymentInstrument) {
        Logger.getLogger('Adyen').error('No order or payment instrument present.');
        return {
            authorized: false, fieldErrors: [], serverErrors: errors, error: true
        };
    }

    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });
    Transaction.begin();

    var result = adyenCheckout.createPaymentRequest({
        Order: order,
        PaymentInstrument: paymentInstrument,
        ReturnUrl: URLUtils.https('Adyen-OrderConfirm').toString()
    });

    if (result.error) {
        var errors = [];
        errors.push(Resource.msg('error.payment.processor.not.supported', 'checkout', null));
        return {
            authorized: false, fieldErrors: [], serverErrors: errors, error: true
        };
    }

    //Trigger 3DS2.0 flow
    if(result.ThreeDS2){
        Transaction.commit();
        Transaction.wrap(function () {
            paymentInstrument.custom.adyenPaymentData = result.PaymentData;
        });

        session.privacy.orderNo = order.orderNo;
        session.privacy.paymentMethod = paymentInstrument.paymentMethod;

        return {
            ThreeDS2: result.ThreeDS2,
            resultCode: result.resultCode,
            token3ds2: result.token3ds2,
        }
    }

    //Trigger 3DS flow
    else if (result.RedirectObject != '') {
        Transaction.commit();
        Transaction.wrap(function () {
            paymentInstrument.custom.adyenPaymentData = result.PaymentData;
        });

        session.privacy.orderNo = order.orderNo;
        session.privacy.paymentMethod = paymentInstrument.paymentMethod;
        return {
            authorized: true,
            authorized3d: true,
            order: order,
            paymentInstrument: paymentInstrument,
            redirectObject: result.RedirectObject
        };
    }

    if (result.Decision != 'ACCEPT') {
        Transaction.rollback();
        return {
            error: true,
            PlaceOrderError: ('AdyenErrorMessage' in result && !empty(result.AdyenErrorMessage) ? result.AdyenErrorMessage : '')
        };
    }

    AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
    Transaction.commit();

    return {authorized: true, error: false};
}


exports.Handle = Handle;
exports.Authorize = Authorize;