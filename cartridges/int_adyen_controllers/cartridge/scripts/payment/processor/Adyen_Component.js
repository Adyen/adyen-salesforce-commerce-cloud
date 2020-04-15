'use strict';

/* API Includes */
var URLUtils = require('dw/web/URLUtils');
var PaymentMgr = require('dw/order/PaymentMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var constants = require("*/cartridge/adyenConstants/constants");

/* Script Modules */
var app = require(Resource.msg('scripts.app.js', 'require', null));
var Cart = require(Resource.msg('script.models.cartmodel', 'require', null));
var AdyenHelper = require('*/cartridge/scripts/util/AdyenHelper');

var adyenRemovePreviousPI = require('*/cartridge/scripts/adyenRemovePreviousPI');

/**
 * Creates a Adyen payment instrument for the given basket
 */
function Handle(args) {
    // if (result.error) {
    //     return result;
    // }
    // var creditCardForm = app.getForm('billing.paymentMethods.creditCard');
    // var tokenID = AdyenHelper.getCardToken(creditCardForm.get('selectedCardID').value(), customer);
    //
    // // create payment instrument
    // Transaction.wrap(function () {
    //     cart.removeExistingPaymentInstruments(dw.order.PaymentInstrument.METHOD_ADYEN_COMPONENT);
    //     var paymentInstrument = cart.createPaymentInstrument(dw.order.PaymentInstrument.METHOD_CREDIT_CARD, cart.getNonGiftCertificateAmount());
    //
    //     paymentInstrument.creditCardHolder = creditCardForm.get('owner').value();
    //     paymentInstrument.creditCardType = creditCardForm.get('type').value();
    //     paymentInstrument.creditCardNumber = creditCardForm.get('number').value();
    //     if (!empty(tokenID)) {
    //         paymentInstrument.setCreditCardToken(tokenID);
    //     }
    // });
    var currentBasket = args.Basket;
    var paymentInformation = app.getForm('adyPaydata');

    Logger.getLogger('Adyen').error('payment information is ... ' + JSON.stringify(paymentInformation.object));
    Logger.getLogger('Adyen').error('adyen state data is ... ' + JSON.stringify(paymentInformation.get("adyenStateData").value()));
    Transaction.wrap(function () {
        var result = adyenRemovePreviousPI.removePaymentInstruments(currentBasket);
        if (result.error) {
            return result;
        }

        var paymentInstrument = currentBasket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, currentBasket.totalGrossPrice);
            Logger.getLogger('Adyen').error('payment instrument is ... ' + JSON.stringify(paymentInstrument));
            paymentInstrument.custom.adyenPaymentData = paymentInformation.get("adyenStateData").value();
            // paymentInstrument.custom.adyenPaymentMethod = paymentInformation.adyenPaymentMethod;

        // if (paymentInformation.isCreditCard) {
        //     var sfccCardType = AdyenHelper.getSFCCCardType(paymentInformation.cardType);
        //     var tokenID = AdyenHelper.getCardToken(paymentInformation.storedPaymentUUID, customer);

            // paymentInstrument.setCreditCardNumber(paymentInformation.cardNumber);
            // paymentInstrument.setCreditCardType(sfccCardType);

            // if (tokenID) {
            //     paymentInstrument.setCreditCardExpirationMonth(paymentInformation.expirationMonth.value);
            //     paymentInstrument.setCreditCardExpirationYear(paymentInformation.expirationYear.value);
            //     paymentInstrument.setCreditCardToken(tokenID);
            // }
        // } else {
            //Local payment data
            // if (paymentInformation.adyenIssuerName) {
            //     paymentInstrument.custom.adyenIssuerName = paymentInformation.adyenIssuerName;
            // }
        // }
    });

    return {success: true};
}

/**
 * Call the  Adyen API to Authorize CC using details entered by shopper.
 */
function Authorize(args) {
    var adyenCheckout = require("*/cartridge/scripts/adyenCheckout");
    var order = args.Order;
    var paymentInstrument = args.PaymentInstrument;
    var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();

    Transaction.wrap(function () {
        paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    });

    Transaction.begin();
    var result = adyenCheckout.createPaymentRequest({
        Order: order,
        PaymentInstrument: paymentInstrument
    });
    Logger.getLogger('Adyen').error('result is ... ' + JSON.stringify(result));


    if (result.error) {
        Transaction.rollback();
        let args = 'args' in result ? result.args : null;

        return {
            error: true,
            PlaceOrderError: (!empty(args) && 'AdyenErrorMessage' in args && !empty(args.AdyenErrorMessage) ? args.AdyenErrorMessage : '')
        };
    }
    // if(result.threeDS2){
    //     Transaction.commit();
    //     Transaction.wrap(function () {
    //         paymentInstrument.custom.adyenPaymentData = result.paymentData;
    //     });
    //
    //     session.privacy.orderNo = order.orderNo;
    //     session.privacy.paymentMethod = paymentInstrument.paymentMethod;
    //
    //     return {
    //         authorized: true,
    //         authorized3d: true,
    //         view : app.getView({
    //             ContinueURL: URLUtils.https('Adyen-Redirect3DS2', 'utm_nooverride', '1'),
    //             resultCode: result.resultCode,
    //             token3ds2: result.token3ds2
    //         })
    //     }
    // }

    // if(result.redirectObject != ''){
    //     if(result.redirectObject.url && result.redirectObject.data && result.redirectObject.data.MD){
    //         Transaction.commit();
    //         if(result.paymentData){
    //             Transaction.wrap( function() {
    //                 paymentInstrument.custom.adyenPaymentData = result.paymentData;
    //             });
    //         }
    //         session.privacy.orderNo = order.orderNo;
    //         session.privacy.paymentMethod = paymentInstrument.paymentMethod;
    //         return {
    //             authorized: true,
    //             authorized3d: true,
    //             redirectObject: result.redirectObject,
    //             view: app.getView({
    //                 ContinueURL: URLUtils.https('Adyen-CloseThreeDS', 'utm_nooverride', '1'),
    //                 Basket: order,
    //                 issuerUrl : result.redirectObject.url,
    //                 paRequest : result.redirectObject.data.PaReq,
    //                 md : result.redirectObject.data.MD
    //             })};
    //     }
    //     else{
    //         Logger.getLogger("Adyen").error("3DS details incomplete");
    //         return {
    //             error: true,
    //             PlaceOrderError: ('AdyenErrorMessage' in result && !empty(result.adyenErrorMessage) ? result.adyenErrorMessage : '')
    //         };
    //     }
    // }

    if(result.threeDS2 || result.resultCode == "RedirectShopper") {
        paymentInstrument.custom.adyenPaymentData = result.paymentData;
        Transaction.commit();

        session.privacy.orderNo = order.orderNo;
        session.privacy.paymentMethod = paymentInstrument.paymentMethod;

        if (result.threeDS2) {
            Logger.getLogger("Adyen").error("entering three DS2");
            return {
                authorized3d: true,
                view: app.getView({
                    ContinueURL: URLUtils.https('Adyen-Redirect3DS2', 'utm_nooverride', '1'),
                    resultCode: result.resultCode,
                    token3ds2: result.token3ds2
                })
            }
        }

        var signature = null;

        //If the response has MD, then it is a 3DS transaction
        if (result.redirectObject && result.redirectObject.data && result.redirectObject.data.MD) {
            session.privacy.MD = result.redirectObject.data.MD;
            return {
                authorized3d: true,
                view: app.getView({
                    ContinueURL: URLUtils.https('Adyen-AuthorizeWithForm', 'utm_nooverride', '1'),
                    Basket: order,
                    issuerUrl: result.redirectObject.url,
                    paRequest: result.redirectObject.data.PaReq,
                    md: result.redirectObject.data.MD
                })
            }
        } else {
            //Signature only needed for redirect methods
            signature = AdyenHelper.getAdyenHash(result.redirectObject.url, result.paymentData);
            //TODO check if signature is needed
        }
        return {
            order: order,
            paymentInstrument: paymentInstrument,
            redirectObject: result.redirectObject
        };
    }

    if (result.decision != 'ACCEPT') {
        Transaction.rollback();
        return {
            error: true,
            PlaceOrderError: ('AdyenErrorMessage' in result && !empty(result.adyenErrorMessage) ? result.adyenErrorMessage : '')
        };
    }

    AdyenHelper.savePaymentDetails(paymentInstrument, order, result);

    Transaction.commit();

    return {authorized: true};
}

exports.Handle = Handle;
exports.Authorize = Authorize;