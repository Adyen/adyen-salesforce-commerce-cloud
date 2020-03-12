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
    Logger.getLogger("Adyen").error("paymentInformation = " + JSON.stringify(paymentInformation));

    var currentBasket = basket;
    var cardErrors = {};
    var serverErrors = [];
    Transaction.wrap(function () {
        collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
            currentBasket.removePaymentInstrument(item);
        });
        var paymentInstrument = currentBasket.createPaymentInstrument("AdyenComponent", currentBasket.totalGrossPrice);
        paymentInstrument.custom.adyenPaymentData = paymentInformation.stateData;
        paymentInstrument.custom.adyenPaymentMethod = paymentInformation.adyenPaymentMethod;

        if (paymentInformation.isCreditCard) {
            var sfccCardType = AdyenHelper.getSFCCCardType(paymentInformation.cardType);
            var tokenID = AdyenHelper.getCardToken(paymentInformation.storedPaymentUUID, customer);

            paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
            paymentInstrument.setCreditCardType(sfccCardType);

            if (tokenID) {
                paymentInstrument.setCreditCardExpirationMonth(paymentInformation.expirationMonth.value);
                paymentInstrument.setCreditCardExpirationYear(paymentInformation.expirationYear.value);
                paymentInstrument.setCreditCardToken(tokenID);
            }
        } else {
            //Local payment data
            if (paymentInformation.adyenIssuerName) {
                paymentInstrument.custom.adyenIssuerName = paymentInformation.adyenIssuerName;
            }
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
    var Transaction = require("dw/system/Transaction");
    var OrderMgr = require("dw/order/OrderMgr");
    var order = OrderMgr.getOrder(orderNumber);

    var adyenCheckout = require("*/cartridge/scripts/adyenCheckout");
    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    Logger.getLogger("Adyen").error("Authorize");
    Transaction.begin();
    var result = adyenCheckout.createPaymentRequest({
        Order: order,
        PaymentInstrument: paymentInstrument,
        ReturnUrl: URLUtils.https("Adyen-OrderConfirm").toString()
    });

    Logger.getLogger("Adyen").error("Authorize result = " + JSON.stringify(result));
    if (result.error) {
        var errors = [];
        errors.push(Resource.msg("error.payment.processor.not.supported", "checkout", null));
        return {
            authorized: false, fieldErrors: [], serverErrors: errors, error: true
        };
    }

    //TODO BAS Combine resultcod
    //Trigger 3DS2 flow
    if(result.threeDS2){
        Transaction.commit();
        Transaction.wrap(function () {
            paymentInstrument.custom.adyenPaymentData = result.paymentData;
        });

        session.privacy.orderNo = order.orderNo;
        session.privacy.paymentMethod = paymentInstrument.paymentMethod;

        return {
            threeDS2: result.threeDS2,
            resultCode: result.resultCode,
            token3ds2: result.token3ds2,
        }
    }

    else if (result.resultCode == "RedirectShopper") {
        Transaction.commit();
        Transaction.wrap(function () {
            paymentInstrument.custom.adyenPaymentData = result.paymentData;
        });

        session.privacy.orderNo = order.orderNo;
        session.privacy.paymentMethod = paymentInstrument.paymentMethod;
        var signature = null;
        var authorized3d = false;

        //If the response has MD, then it is a 3DS transaction
        if(result.redirectObject.data.MD){
            authorized3d = true;
        }
        else {
            //Signature only needed for redirect methods
            signature = AdyenHelper.getAdyenHash(result.redirectObject.url, result.paymentData);
        }

        return {
            authorized: true,
            authorized3d: authorized3d,
            orderNo: orderNumber,
            paymentInstrument: paymentInstrument,
            redirectObject: result.redirectObject,
            signature: signature
        };
    }
    else if (result.resultCode == "Authorised" || result.resultCode == "Received" || result.resultCode == "PresentToShopper") {
        AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
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