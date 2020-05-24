'use strict';

/* API Includes */
var URLUtils = require('dw/web/URLUtils');
var PaymentMgr = require('dw/order/PaymentMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
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
    var currentBasket = args.Basket;
    var paymentInformation = app.getForm('adyPaydata');

    Transaction.wrap(function () {
        var result = adyenRemovePreviousPI.removePaymentInstruments(currentBasket);
        if (result.error) {
            return result;
        }
        var paymentInstrument = currentBasket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, currentBasket.totalGrossPrice);
            paymentInstrument.custom.adyenPaymentData = paymentInformation.get("adyenStateData").value();
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


    if (result.error) {
        Transaction.rollback();
        let args = 'args' in result ? result.args : null;

        return {
            error: true,
            PlaceOrderError: (!empty(args) && 'AdyenErrorMessage' in args && !empty(args.AdyenErrorMessage) ? args.AdyenErrorMessage : '')
        };
    }

    if(result.pspReference){
        order.custom.Adyen_pspReference = result.pspReference;
    }

    if(result.threeDS2 || result.resultCode == "RedirectShopper") {
        paymentInstrument.custom.adyenPaymentData = result.paymentData;
        Transaction.commit();

        session.privacy.orderNo = order.orderNo;
        session.privacy.paymentMethod = paymentInstrument.paymentMethod;

        if (result.threeDS2) {
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