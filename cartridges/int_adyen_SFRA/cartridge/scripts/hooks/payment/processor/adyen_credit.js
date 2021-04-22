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
var Logger = require('dw/system/Logger');

function Handle(basket, paymentInformation) {
    var currentBasket = basket;
    var cardErrors = {};
    var serverErrors = [];
    var creditCardForm = server.forms.getForm('billing');
    var cardType = AdyenHelper.getSFCCCardType(paymentInformation.cardType.value);
    var tokenID = AdyenHelper.getCardToken(creditCardForm.creditCardFields.selectedCardID.value, customer);
    Transaction.wrap(function () {
        collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
            currentBasket.removePaymentInstrument(item);
        });

        var paymentInstrument = currentBasket.createPaymentInstrument(
            PaymentInstrument.METHOD_CREDIT_CARD, currentBasket.totalGrossPrice
        );

        paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber.value);
        paymentInstrument.setCreditCardType(cardType);

        if (!empty(tokenID)) {
            paymentInstrument.setCreditCardExpirationMonth(paymentInformation.expirationMonth.value);
            paymentInstrument.setCreditCardExpirationYear(paymentInformation.expirationYear.value)
            paymentInstrument.setCreditCardType(paymentInformation.cardType.value);
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
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var order = OrderMgr.getOrder(orderNumber);
    var creditCardForm = server.forms.getForm('billing').creditCardFields;
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });
    Transaction.begin();

    var result = adyenCheckout.creditCard({
        Order: order,
        CurrentSession: session,
        CurrentRequest: request,
        PaymentInstrument: paymentInstrument,
        CreditCardForm: creditCardForm,
        SaveCreditCard: creditCardForm.saveCardAdyen.value
    });

    if (result.error) {
        var errors = [];
        errors.push(Resource.msg('error.payment.processor.not.supported', 'checkout', null));
        return {
            authorized: false, fieldErrors: [], serverErrors: errors, error: true
        };
    }

    //Trigger 3DS2 flow
    if(result.threeDS2 || result.resultCode === 'RedirectShopper') {
        let paymentData = result.paymentData || result.PaymentData;
        paymentInstrument.custom.adyenPaymentData = paymentData;
        Transaction.commit();

        session.privacy.orderNo = order.orderNo;
        session.privacy.paymentMethod = paymentInstrument.paymentMethod;

        if (result.threeDS2) {
            return {
                ThreeDS2: result.ThreeDS2,
                resultCode: result.resultCode,
                token3ds2: result.token3ds2,
            }
        }

        let signature = null;
        let authorized3d = false;
        let redirectObject = result.redirectObject || result.RedirectObject;

        // If the response has MD, then it is a 3DS transaction
        if (
            redirectObject
            && redirectObject.data
            && redirectObject.data.MD
        ) {
            authorized3d = true;
            signature = AdyenHelper.getAdyenHash(
                redirectObject.url.substr(redirectObject.url.length - 25),
                redirectObject.data.MD.substr(1, 25)
            );
        } else {
            // Signature only needed for redirect methods
            signature = AdyenHelper.getAdyenHash(
                redirectObject.url.substr(redirectObject.url.length - 25),
                paymentData.substr(1, 25)
            );
        }

        return {
            authorized: true,
            authorized3d: authorized3d,
            order: order,
            orderNo: orderNumber,
            paymentInstrument: paymentInstrument,
            redirectObject: redirectObject,
            signature: signature
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