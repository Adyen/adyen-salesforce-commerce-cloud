'use strict';

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var logger = require('dw/system/Logger').getLogger('Adyen', 'adyen');
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');
var Site = require('dw/system/Site');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var constants = require("*/cartridge/adyenConstants/constants");
var PaymentMgr = require('dw/order/PaymentMgr');


/* Script Modules */
var app = require('app_storefront_controllers/cartridge/scripts/app');
var guard = require('app_storefront_controllers/cartridge/scripts/guard');
var AdyenHelper = require('*/cartridge/scripts/util/AdyenHelper');
var OrderModel = app.getModel('Order');
var Logger = require('dw/system/Logger');

const EXTERNAL_PLATFORM_VERSION = "SiteGenesis";
/**
 * Controller for all storefront processes.
 *
 * @module controllers/Adyen
 */

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */
function notify() {
    var	checkAuth = require('*/cartridge/scripts/checkNotificationAuth');

    var status = checkAuth.check(request);
    if (!status) {
        app.getView().render('adyen/error');
        return {};
    }

    var	handleNotify = require('*/cartridge/scripts/handleNotify');

    Transaction.begin();
    var notificationResult = handleNotify.notifyHttpParameterMap(request.httpParameterMap);

    if(notificationResult.success){
        Transaction.commit();
        app.getView().render('notify');
    }
    else {
        app.getView({
            errorMessage: notificationResult.errorMessage
        }).render('/notifyError');
        Transaction.rollback();
    }

}

/**
 * Redirect to Adyen after saving order etc.
 */
function redirect(order, redirectUrl) {
    response.redirect(redirectUrl);
}

/**
 * Show confirmation after return from Adyen
 */
function showConfirmation() {
    var orderNumber = session.privacy.orderNo;
    var order = OrderMgr.getOrder(orderNumber);
    var paymentInstruments = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);
    var adyenPaymentInstrument;
    var paymentData;

    var instrumentsIter = paymentInstruments.iterator();
    while (instrumentsIter.hasNext()) {
        adyenPaymentInstrument = instrumentsIter.next();
        paymentData = adyenPaymentInstrument.custom.adyenPaymentData;
    }

    //details is either redirectResult or payload
    var details;
    if(request.httpParameterMap.redirectResult.value != null){
        details = { 'redirectResult' : request.httpParameterMap.redirectResult.value };
    }
    else if(request.httpParameterMap.payload.value != null){
        details = { 'payload' : request.httpParameterMap.payload.value };
    }

    //redirect to payment/details
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var requestObject = {
        'details': details,
        'paymentData' : paymentData
    }
    var result = adyenCheckout.doPaymentDetailsCall(requestObject);
    Transaction.wrap(function () {
        adyenPaymentInstrument.custom.adyenPaymentData = null;
    });
    if (result.resultCode == 'Authorised' || result.resultCode == 'Pending' || result.resultCode == 'Received' || result.resultCode == 'PresentToShopper') {
        if(result.resultCode == "Received" && result.paymentMethod.indexOf("alipay_hk") > -1) {
            Transaction.wrap(function () {
                OrderMgr.failOrder(order);
            });
            Logger.getLogger("Adyen").error("Did not complete Alipay transaction, result: " + JSON.stringify(result));
            var errorStatus = new dw.system.Status(dw.system.Status.ERROR, "confirm.error.declined");

            app.getController('COSummary').Start({
                PlaceOrderError: errorStatus
            });
            return {};
        }
        Transaction.wrap(function () {
            AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
        });
        OrderModel.submit(order);
        clearForms();
        app.getController('COSummary').ShowConfirmation(order);
        return {};
    }
    // fail order
    Transaction.wrap(function () {
        OrderMgr.failOrder(order);
    });
    Logger.getLogger("Adyen").error("Payment failed, result: " + JSON.stringify(result));
    // should be assingned by previous calls or not
    var errorStatus = new dw.system.Status(dw.system.Status.ERROR, "confirm.error.declined");

    app.getController('COSummary').Start({
        PlaceOrderError: errorStatus
    });
    return {};
}

function paymentFromComponent() {
    if(request.httpParameterMap.getRequestBodyAsString().indexOf('cancelTransaction') > -1) {
        var order = OrderMgr.getOrder(session.privacy.orderNo);
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
        });
        return;
    }

    var adyenRemovePreviousPI = require('*/cartridge/scripts/adyenRemovePreviousPI');

    var currentBasket = BasketMgr.getCurrentBasket();
    var adyenCheckout = require("*/cartridge/scripts/adyenCheckout");
    var paymentInstrument;
    var order;

    Transaction.wrap(function () {
        var result = adyenRemovePreviousPI.removePaymentInstruments(currentBasket);
        if (result.error) {
            return result;
        }
        var stateDataStr = request.httpParameterMap.getRequestBodyAsString();
        paymentInstrument = currentBasket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, currentBasket.totalGrossPrice);
        paymentInstrument.custom.adyenPaymentData = stateDataStr;
        session.privacy.paymentMethod = paymentInstrument.paymentMethod;
        try {
            paymentInstrument.custom.adyenPaymentMethod = JSON.parse(stateDataStr).paymentMethod.type;
        } catch (e) {}
    });
    order = OrderMgr.createOrder(currentBasket);
    session.privacy.orderNo = order.orderNo;

    Transaction.begin();
    var result = adyenCheckout.createPaymentRequest({
        Order: order,
        PaymentInstrument: paymentInstrument
    });

    let responseUtils = require('*/cartridge/scripts/util/Response');
    responseUtils.renderJSON({result: result});
}

function showConfirmationPaymentFromComponent() {
    var paymentInformation = app.getForm('adyPaydata');
    var orderNumber = session.privacy.orderNo;
    var order = OrderMgr.getOrder(orderNumber);
    var paymentInstruments = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);
    var adyenPaymentInstrument;

    var instrumentsIter = paymentInstruments.iterator();
    while (instrumentsIter.hasNext()) {
        adyenPaymentInstrument = instrumentsIter.next();
    }

    var passedData = JSON.parse(paymentInformation.get("paypalStateData").value());
    var details = passedData.details;
    var paymentData  = passedData.paymentData;

    //redirect to payment/details
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var requestObject = {
        'details': details,
        'paymentData' : paymentData
    };
    var result = adyenCheckout.doPaymentDetailsCall(requestObject);
    var paymentProcessor = PaymentMgr.getPaymentMethod(adyenPaymentInstrument.getPaymentMethod()).getPaymentProcessor();

    Transaction.wrap(function () {
        adyenPaymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
        adyenPaymentInstrument.custom.adyenPaymentData = null;
    });
    if (result.resultCode == 'Authorised') {
        Transaction.wrap(function () {
            AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
        });
        OrderModel.submit(order);
        clearForms();
        app.getController('COSummary').ShowConfirmation(order);
        return {};
    }
    // fail order
    Transaction.wrap(function () {
        OrderMgr.failOrder(order);
    });
    // should be assingned by previous calls or not
    var errorStatus = new dw.system.Status(dw.system.Status.ERROR, "confirm.error.declined");

    app.getController('COSummary').Start({
        PlaceOrderError: errorStatus
    });
    return {};
}

/**
 * Separated order confirm for Credit cards and APM's.
 */
function orderConfirm(orderNo){
    var order = null;
    if (orderNo) {
        order = OrderMgr.getOrder(orderNo);
    }
    if (!order) {
        app.getController('Error').Start();
        return {};
    }
    app.getController('COSummary').ShowConfirmation(order);
}

/**
 * Make a request to Adyen to get payment methods based on countryCode. Called from COBilling-Start
 */
function getPaymentMethods(cart, customer) {
    var Locale = require('dw/util/Locale');
    var countryCode = Locale.getLocale(request.getLocale()).country;
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket.getShipments().length > 0 && currentBasket.getShipments()[0].shippingAddress) {
        countryCode = currentBasket.getShipments()[0].shippingAddress.getCountryCode().value.toUpperCase();
    }
    var adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');
    var PaymentMgr = require('dw/order/PaymentMgr');
    var getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');
    var response = getPaymentMethods.getMethods(cart.object, customer, countryCode);
    var paymentMethodDescriptions = response.paymentMethods.map(function (method) {
        return {
            brandCode: method.type,
            description: Resource.msg("hpp.description." + method.type, "hpp", "")
        };
    });
    var adyenURL = AdyenHelper.getLoadingContext() + "images/logos/medium/";

    var connectedTerminals = {};
    if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive()) {
        try {
            var connectedTerminalsResponse = adyenTerminalApi.getTerminals().response;
            if(connectedTerminalsResponse){
                connectedTerminals = JSON.parse(connectedTerminalsResponse);
            }
        } catch (e) {}

    }
    var jsonResponse = {
        adyenPaymentMethods: response,
        adyenConnectedTerminals: connectedTerminals,
        ImagePath: adyenURL,
        AdyenDescriptions: paymentMethodDescriptions
    };

    if(AdyenHelper.getCreditCardInstallments()) {
        var paymentAmount = currentBasket.getTotalGrossPrice() ? AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()) : 1000;
        var currency = currentBasket.getTotalGrossPrice().currencyCode;
        jsonResponse.amount = {value: paymentAmount, currency: currency};
        jsonResponse.countryCode = countryCode;
    }

    return jsonResponse;
}

function redirect3ds2() {
    var adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');
    var originKey = adyenGetOriginKey.getOriginKeyFromRequest(request.httpProtocol, request.httpHost);
    var environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
    var locale = request.getLocale();

    app.getView({
        locale: locale,
        originKey: originKey,
        environment: environment,
        resultCode : request.httpParameterMap.get("resultCode").stringValue,
        token3ds2 : request.httpParameterMap.get("token3ds2").stringValue,
        ContinueURL: URLUtils.https('Adyen-Authorize3DS2')
    }).render('/threeds2/adyen3ds2');
}

/**
 * Make second call to /payments/details with IdentifyShopper or ChallengeShopper token
 *
 * @returns rendering template or error
 */
function authorize3ds2() {
    Transaction.begin();
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var paymentInstrument;
    var order;

    if (session.privacy.orderNo && session.privacy.paymentMethod) {
        try {
            order = OrderMgr.getOrder(session.privacy.orderNo);
            paymentInstrument = order.getPaymentInstruments(session.privacy.paymentMethod)[0];
        } catch (e) {
            Logger.getLogger("Adyen").error("Unable to retrieve order data from session 3DS2.");
            Transaction.wrap(function () {
                OrderMgr.failOrder(order);
            });
            app.getController('COSummary').Start({
                PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', '')
            });
            return {};
        }

        var details = {};

        if (request.httpParameterMap.get("resultCode").stringValue == "IdentifyShopper" && request.httpParameterMap.get("fingerprintResult").stringValue) {
            details = {
                "threeds2.fingerprint": request.httpParameterMap.get("fingerprintResult").stringValue
            }
        } else if (request.httpParameterMap.get("resultCode").stringValue == "ChallengeShopper" && request.httpParameterMap.get("challengeResult").stringValue) {
            details = {
                "threeds2.challengeResult": request.httpParameterMap.get("challengeResult").stringValue
            }
        }
        else {
            Logger.getLogger("Adyen").error("paymentDetails 3DS2 not available");
            Transaction.wrap(function () {
                OrderMgr.failOrder(order);
            });
            app.getController('COSummary').Start({
                PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', '')
            });
            return {};
        }

        var paymentDetailsRequest = {
            "paymentData": paymentInstrument.custom.adyenPaymentData,
            "details": details
        };

        var result = adyenCheckout.doPaymentDetailsCall(paymentDetailsRequest);
        if ((result.error || result.resultCode != 'Authorised') && result.resultCode != 'ChallengeShopper') {
            //Payment failed
            Transaction.wrap(function () {
                OrderMgr.failOrder(order);
                paymentInstrument.custom.adyenPaymentData = null;
            });
            app.getController('COSummary').Start({
                PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', '')
            });
            return {};
        } else if (result.resultCode == 'ChallengeShopper') {
            app.getView({
                ContinueURL: URLUtils.https('Adyen-Redirect3DS2', 'utm_nooverride', '1'),
                resultCode: result.resultCode,
                token3ds2: result.authentication['threeds2.challengeToken']
            }).render('adyenpaymentredirect');
            return {};
        }

        //delete paymentData from requests
        Transaction.wrap(function () {
            paymentInstrument.custom.adyenPaymentData = null;
        });

        if ('pspReference' in result && !empty(result.pspReference)) {
            paymentInstrument.paymentTransaction.transactionID = result.pspReference;
            order.custom.Adyen_pspReference = result.pspReference;
        }
        if ('resultCode' in result && !empty(result.resultCode)) {
            paymentInstrument.paymentTransaction.custom.authCode = result.resultCode;
        }

        // Save full response to transaction custom attribute
        paymentInstrument.paymentTransaction.custom.Adyen_log = JSON.stringify(result);

        order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
        order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
        paymentInstrument.custom.adyenPaymentData = null;
        Transaction.commit();

        OrderModel.submit(order);
        clearForms();
        app.getController('COSummary').ShowConfirmation(order);
        return {};
    }

    Logger.getLogger("Adyen").error("Session variables for 3DS2 do not exist");
    app.getController('COSummary').Start({
        PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', '')
    });
    return {};
}


/**
 * Make /payments/details call to 3d verification system to complete authorization
 *
 * @returns rendering template or error
 */
function authorizeWithForm() {
    var order;
    var paymentInstrument;
    var MD = request.httpParameterMap.get("MD").stringValue;
    var PaRes = request.httpParameterMap.get("PaRes").stringValue;

    if(session.privacy.orderNo && session.privacy.paymentMethod) {
        try {
            order = OrderMgr.getOrder(session.privacy.orderNo);
            paymentInstrument = order.getPaymentInstruments(session.privacy.paymentMethod)[0];
        } catch (e) {
            Logger.getLogger("Adyen").error("Unable to retrieve order data from session.");
            Transaction.wrap(function () {
                OrderMgr.failOrder(order);
            });
            app.getController('COSummary').Start({
                PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', '')
            });
            return {};
        }

        if(session.privacy.MD === MD) { //compare the MD from Adyen's payments response with the one from the issuer
            clearCustomSessionFields();
            Transaction.begin();
            var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
            var jsonRequest = {
                "paymentData": paymentInstrument.custom.adyenPaymentData,
                "details": {
                    "MD": MD,
                    "PaRes": PaRes
                }
            };

            var result = adyenCheckout.doPaymentDetailsCall(jsonRequest);

            if (result.error || result.resultCode != 'Authorised') {
                Transaction.rollback();
                Transaction.wrap(function () {
                    paymentInstrument.custom.adyenPaymentData = null;
                    OrderMgr.failOrder(order);
                });
                app.getController('COSummary').Start({
                    PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', '')
                });
                return {};
            }
            if ('pspReference' in result && !empty(result.pspReference)) {
                paymentInstrument.paymentTransaction.transactionID = result.pspReference;
                order.custom.Adyen_pspReference = result.pspReference;
            }
            if ('resultCode' in result && !empty(result.resultCode)) {
                paymentInstrument.paymentTransaction.custom.authCode = result.resultCode;
            }

            // Save full response to transaction custom attribute
            paymentInstrument.paymentTransaction.custom.Adyen_log = JSON.stringify(result);

            order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
            order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
            paymentInstrument.custom.adyenPaymentData = null;
            Transaction.commit();

            OrderModel.submit(order);
            clearForms();
            app.getController('COSummary').ShowConfirmation(order);
            return {};
        } else {
            Logger.getLogger("Adyen").error("Session variable MD does not exists");
            app.getController('COSummary').Start({
                PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', '')
            });
            return {};
        }
    }
}

/**
 * Clear system session data
 */
function clearForms() {
    // Clears all forms used in the checkout process.
    session.forms.singleshipping.clearFormElement();
    session.forms.multishipping.clearFormElement();
    session.forms.billing.clearFormElement();

    clearCustomSessionFields();
}

/**
 * Clear custom session data
 */
function clearCustomSessionFields() {
    // Clears all fields used in the 3d secure payment.
    session.privacy.adyenResponse = null;
    session.privacy.paymentMethod = null;
    session.privacy.orderNo = null;
    session.privacy.adyenBrandCode = null;
    session.privacy.adyenIssuerID = null;
}

function getExternalPlatformVersion(){
    return EXTERNAL_PLATFORM_VERSION;
}

exports.Authorize3DS2 = guard.ensure(['https', 'post'], authorize3ds2);

exports.Redirect3DS2 = guard.ensure(['https', 'post'], redirect3ds2);

exports.AuthorizeWithForm = guard.ensure(['https', 'post'], authorizeWithForm);

exports.Notify = guard.ensure(['post'], notify);

exports.Redirect = redirect;

exports.ShowConfirmation = guard.httpsGet(showConfirmation);

exports.ShowConfirmationPaymentFromComponent = guard.ensure(['https'], showConfirmationPaymentFromComponent);

exports.OrderConfirm = guard.httpsGet(orderConfirm);

exports.GetPaymentMethods = getPaymentMethods;

exports.getExternalPlatformVersion = getExternalPlatformVersion();

exports.PaymentFromComponent = guard.ensure(['https', 'post'], paymentFromComponent);
