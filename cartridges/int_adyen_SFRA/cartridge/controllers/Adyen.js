'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
var OrderMgr = require('dw/order/OrderMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var adyenHelper = require('*/cartridge/scripts/util/AdyenHelper');

const EXTERNAL_PLATFORM_VERSION = "SFRA";

server.get('Adyen3D', server.middleware.https, function (req, res, next) {
    var IssuerURL = req.querystring.IssuerURL;
    var PaRequest = req.querystring.PaRequest;
    var MD = req.querystring.MD;
    var TermURL = URLUtils.https('Adyen-AuthorizeWithForm');

    res.render('adyenform', {
        issuerUrl: IssuerURL,
        paRequest: PaRequest,
        md: MD,
        ContinueURL: TermURL
    });
    next();
});

server.post('AuthorizeWithForm', server.middleware.https, function (req, res, next) {
    var adyenCheckout = require('int_adyen_overlay/cartridge/scripts/adyenCheckout');
    var paymentInstrument;
    var order;

    if (session.custom.orderNo && session.custom.paymentMethod) {
        try {
            order = OrderMgr.getOrder(session.custom.orderNo);
            paymentInstrument = order.getPaymentInstruments(session.custom.paymentMethod)[0];
        } catch (e) {
            Logger.getLogger("Adyen").error("Unable to retrieve order data from session.");
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
            return next();
        }

        if (session.custom.MD == req.form.MD) {
            var jsonRequest = {
                "paymentData": paymentInstrument.custom.adyenPaymentData,
                "details": {
                    "MD": req.form.MD,
                    "PaRes": req.form.PaRes
                }
            };
            var result = adyenCheckout.doPaymentDetailsCall(jsonRequest);
            Transaction.wrap(function () {
                paymentInstrument.custom.adyenPaymentData = null;
            });
            // if error, return to checkout page
            if (result.error || result.resultCode != 'Authorised') {
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order);
                });
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
                return next();
            }

            //custom fraudDetection
            var fraudDetectionStatus = {status: 'success'};

            // Places the order
            var placeOrderResult = adyenHelpers.placeOrder(order, fraudDetectionStatus);
            if (placeOrderResult.error) {
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order);
                });
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'paymentError', Resource.msg('error.technical', 'checkout', null)));
                return next();
            }

            Transaction.begin();
            order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
            order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
            paymentInstrument.paymentTransaction.transactionID = result.pspReference;
            Transaction.commit();
            COHelpers.sendConfirmationEmail(order, req.locale.id);
            clearForms();
            res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
            return next();
        }
    }
    Logger.getLogger("Adyen").error("Session variable does not exists");
    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
    return next();
});

server.get('Adyen3DS2', server.middleware.https, function (req, res, next) {
    var resultCode = req.querystring.resultCode;
    var token3ds2 = req.querystring.token3ds2;

    res.render('/threeds2/adyen3ds2', {
        resultCode: resultCode,
        token3ds2: token3ds2
    });
    return next();
});

server.post('Authorize3DS2', server.middleware.https, function (req, res, next) {
    var adyenCheckout = require('int_adyen_overlay/cartridge/scripts/adyenCheckout');
    var paymentInstrument;
    var order;

    if (session.custom.orderNo && session.custom.paymentMethod) {
        try {
            order = OrderMgr.getOrder(session.custom.orderNo);
            paymentInstrument = order.getPaymentInstruments(session.custom.paymentMethod)[0];
        } catch (e) {
            Logger.getLogger("Adyen").error("Unable to retrieve order data from session 3DS2.");
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
            return next();
        }

        var details = {};
        if (req.form.resultCode == "IdentifyShopper" && req.form.fingerprintResult) {
            details = {
                "threeds2.fingerprint": req.form.fingerprintResult
            }
        } else if (req.form.resultCode == "ChallengeShopper" && req.form.challengeResult) {
            details = {
                "threeds2.challengeResult": req.form.challengeResult
            }
        }
        else {
            Logger.getLogger("Adyen").error("paymentDetails 3DS2 not available");
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
            return next();
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
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
            return next();
        } else if (result.resultCode == 'ChallengeShopper') {
            //Redirect to ChallengeShopper
            res.redirect(URLUtils.url('Adyen-Adyen3DS2', 'resultCode', result.resultCode, 'token3ds2', result.authentication['threeds2.challengeToken']));
            return next();
        }

        //delete paymentData from requests
        Transaction.wrap(function () {
            paymentInstrument.custom.adyenPaymentData = null;
        });

        //custom fraudDetection
        var fraudDetectionStatus = {status: 'success'};

        // Places the order
        var placeOrderResult = adyenHelpers.placeOrder(order, fraudDetectionStatus);
        if (placeOrderResult.error) {
            Transaction.wrap(function () {
                OrderMgr.failOrder(order);
            });
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'paymentError', Resource.msg('error.technical', 'checkout', null)));
            return next();
        }

        Transaction.begin();
        order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
        order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
        paymentInstrument.paymentTransaction.transactionID = result.pspReference;
        Transaction.commit();
        COHelpers.sendConfirmationEmail(order, req.locale.id);
        clearForms();
        res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
        return next();
    }

    Logger.getLogger("Adyen").error("Session variables for 3DS2 do not exists");
    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
    return next();
});


server.get('Redirect', server.middleware.https, function (req, res, next) {
    res.redirect(req.querystring.redirectUrl);
    return next();
});

server.get('ShowConfirmation', server.middleware.https, function (req, res, next) {
    var payLoad = req.querystring.payload;

    //redirect to payment/details
    var adyenCheckout = require('int_adyen_overlay/cartridge/scripts/adyenCheckout');
    var requestObject = {};
    requestObject['details'] = {};
    requestObject.details['payload'] = payLoad;
    var result = adyenCheckout.doPaymentDetailsCall(requestObject);
    var order = OrderMgr.getOrder(result.merchantReference);
    var paymentInstrument = order.getPaymentInstrument();
    Transaction.wrap(function () {
        paymentInstrument.custom.adyenPaymentData = null;
    });
    // Authorised: The payment authorisation was successfully completed.
    if (result.resultCode == "Authorised" || result.resultCode == 'Pending' || result.resultCode == 'Received') {
        var OrderModel = require('*/cartridge/models/order');
        var Locale = require('dw/util/Locale');
        var currentLocale = Locale.getLocale(req.locale.id);
        var orderModel = new OrderModel(order, {countryCode: currentLocale.country});

        //Save orderModel to custom object during session
        Transaction.wrap(function () {
            order.custom.Adyen_CustomerEmail = JSON.stringify(orderModel);
        });

        clearForms();
        res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
    } else {
        Transaction.wrap(function () {
            OrderMgr.failOrder(order);
        });
        Logger.getLogger("Adyen").error("Payment failed, result: " + JSON.stringify(result));
        res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
    }
    return next();
});

server.get('OrderConfirm', server.middleware.https, function (req, res, next) {
    res.redirect(URLUtils.url('Order-Confirm', 'ID', req.querystring.ID, 'token', req.querystring.token).toString());
    return next();
});

server.get('GetPaymentMethods', server.middleware.https, function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');
    var Locale = require('dw/util/Locale');
    var countryCode = Locale.getLocale(req.locale.id).country;
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket.getShipments().length > 0 && currentBasket.getShipments()[0].shippingAddress) {
        countryCode = currentBasket.getShipments()[0].shippingAddress.getCountryCode();
    }
    var paymentMethods;
    try {
        paymentMethods = getPaymentMethods.getMethods(BasketMgr.getCurrentBasket(), countryCode.value.toString()).paymentMethods;
    } catch (err) {
        paymentMethods = [];
    }

    paymentMethods = paymentMethods.filter(function (method) {
        return !isMethodTypeBlocked(method.type);
    });
    var descriptions = [];
    paymentMethods.forEach(function (method) {
        descriptions.push({
            brandCode: method.type,
            description: Resource.msg('hpp.description.' + method.type, 'hpp', "")
        });
    })

    var adyenURL = adyenHelper.getAdyenUrl() + "hpp/img/pm/";

    res.json({
        AdyenHppPaymentMethods: paymentMethods,
        ImagePath: adyenURL,
        AdyenDescriptions: descriptions
    });
    return next();
});

/**
 * Checks if payment method is blocked
 */
function isMethodTypeBlocked(methodType) {
    if (methodType.indexOf('bcmc_mobile_QR') !== -1 ||
        (methodType.indexOf('wechatpay') !== -1 && methodType.indexOf('wechatpayWeb') === -1) ||
        methodType == "scheme") {
        return true;
    } else {
        return false;
    }
}

/**
 * Get OriginKey for Secured Fields
 */
server.get('GetConfigurationComponents', server.middleware.https, function (req, res, next) {
    var adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');
    var baseUrl = req.querystring.protocol + "//" + Site.getCurrent().getHttpsHostName();
    var originKey;
    var error = false;
    var errorMessage = "";
    var loadingContext = "";
    var environment = "";

    try {
        originKey = adyenGetOriginKey.getOriginKey(baseUrl).originKeys;
        loadingContext = adyenHelper.getLoadingContext();
        environment = adyenHelper.getAdyenMode().toLowerCase();

    } catch (err) {
        error = true;
        errorMessage = Resource.msg('load.component.error', 'creditCard', null);
    }
    res.json({
        error: error,
        errorMessage: errorMessage,
        adyenOriginKey: originKey,
        adyenLoadingContext: loadingContext,
        adyenEnvironment: environment
    });
    return next();
});

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */
server.post('Notify', server.middleware.https, function (req, res, next) {
    var checkAuth = require('int_adyen_overlay/cartridge/scripts/checkNotificationAuth');
    var status = checkAuth.check(req);
    if (!status) {
        res.render('/adyen/error');
        return {};
    }
    var handleNotify = require('int_adyen_overlay/cartridge/scripts/handleNotify');
    Transaction.begin();
    var success = handleNotify.notify(req.form);

    if (success) {
        Transaction.commit();
        res.render('/notify');
    } else {
        res.json({error: "Notification not handled"});
        Transaction.rollback();
    }
    next();
});

/**
 * Clear system session data
 */
function clearForms() {
    // Clears all forms used in the checkout process.
    session.forms.billing.clearFormElement();
    clearCustomSessionFields();
}

/**
 * Clear custom session data
 */
function clearCustomSessionFields() {
    // Clears all fields used in the 3d secure payment.
    session.custom.paymentMethod = null;
    session.custom.orderNo = null;
    session.custom.brandCode = null;
    session.custom.issuer = null;
    session.custom.adyenPaymentMethod = null;
    session.custom.adyenIssuerName = null;
}

function getExternalPlatformVersion() {
    return EXTERNAL_PLATFORM_VERSION;
}

module.exports = server.exports();

module.exports.getExternalPlatformVersion = getExternalPlatformVersion();