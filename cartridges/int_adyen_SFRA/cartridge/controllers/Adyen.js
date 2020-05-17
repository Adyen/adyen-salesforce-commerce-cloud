'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var Transaction = require('dw/system/Transaction');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
var OrderMgr = require('dw/order/OrderMgr');
var CustomerMgr = require('dw/customer/CustomerMgr');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var AdyenHelper = require('*/cartridge/scripts/util/AdyenHelper');
var constants = require("*/cartridge/adyenConstants/constants");
var collections = require('*/cartridge/scripts/util/collections');

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
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var paymentInstrument;
    var order;

    if (session.privacy.orderNo && session.privacy.paymentMethod) {
        try {
            order = OrderMgr.getOrder(session.privacy.orderNo);
            paymentInstrument = order.getPaymentInstruments(session.privacy.paymentMethod)[0];
        } catch (e) {
            Logger.getLogger("Adyen").error("Unable to retrieve order data from session.");
            res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
            return next();
        }

        if (session.privacy.MD == req.form.MD) {
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
            var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
            if (placeOrderResult.error) {
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order);
                });
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'paymentError', Resource.msg('error.technical', 'checkout', null)));
                return next();
            }

            Transaction.begin();
            AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
            order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
            order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
            Transaction.commit();
            COHelpers.sendConfirmationEmail(order, req.locale.id);
            clearForms();
            res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
            return next();
        }
    }
    Logger.getLogger("Adyen").error("Session variable does not exists");
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
});

server.get('Adyen3DS2', server.middleware.https, function (req, res, next) {
    var protocol = req.https ? "https" : "http";
    var adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');

    try {
        var originKey = adyenGetOriginKey.getOriginKeyFromRequest(protocol, req.host);
        var environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
        var resultCode = req.querystring.resultCode;
        var token3ds2 = req.querystring.token3ds2;
        res.render('/threeds2/adyen3ds2', {
            locale: request.getLocale(),
            originKey: originKey,
            environment: environment,
            resultCode: resultCode,
            token3ds2: token3ds2
        });

    } catch (err) {
        Logger.getLogger("Adyen").error("3DS2 redirect failed with reason: " + err.toString());
        res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    }

    return next();


});

server.post('Authorize3DS2', server.middleware.https, function (req, res, next) {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var paymentInstrument;
    var order;
    if (session.privacy.orderNo && session.privacy.paymentMethod) {
        try {
            order = OrderMgr.getOrder(session.privacy.orderNo);
            paymentInstrument = order.getPaymentInstruments(session.privacy.paymentMethod)[0];
        } catch (e) {
            Logger.getLogger("Adyen").error("Unable to retrieve order data from session 3DS2.");
            res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
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
        var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
        if (placeOrderResult.error) {
            Transaction.wrap(function () {
                OrderMgr.failOrder(order);
            });
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'paymentError', Resource.msg('error.technical', 'checkout', null)));
            return next();
        }

        Transaction.begin();
        AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
        order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
        order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
        Transaction.commit();
        COHelpers.sendConfirmationEmail(order, req.locale.id);
        clearForms();
        res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
        return next();
    }

    Logger.getLogger("Adyen").error("Session variables for 3DS2 do not exists");
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
});

server.get('Redirect', server.middleware.https, function (req, res, next) {
    var signature = req.querystring.signature;
    var order = OrderMgr.getOrder(session.privacy.orderNo);
    if(order && signature){
        var paymentInstruments = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);
        var adyenPaymentInstrument;
        var paymentData;

        //looping through all Adyen payment methods, however, this only can be one.
        var instrumentsIter = paymentInstruments.iterator();
        while (instrumentsIter.hasNext()) {
            adyenPaymentInstrument = instrumentsIter.next();
            paymentData = adyenPaymentInstrument.custom.adyenPaymentData;
        }
        var currentSignature = AdyenHelper.getAdyenHash(req.querystring.redirectUrl, paymentData);

        if(signature == currentSignature) {
            res.redirect(req.querystring.redirectUrl);
            return next();
        }
    }
    else {
        Logger.getLogger("Adyen").error("No signature or no order with orderNo " + session.privacy.orderNo);
    }

    Logger.getLogger("Adyen").error("Redirect signature is not correct");
    Transaction.wrap(function () {
        OrderMgr.failOrder(order);
    });
    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
    return next();
});

server.get('ShowConfirmation', server.middleware.https, function (req, res, next) {
    try {
        var order = OrderMgr.getOrder(session.privacy.orderNo);
        var paymentInstruments = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);
        var adyenPaymentInstrument;
        var paymentData;
        var details;

        //looping through all Adyen payment methods, however, this only can be one.
        var instrumentsIter = paymentInstruments.iterator();
        while (instrumentsIter.hasNext()) {
            adyenPaymentInstrument = instrumentsIter.next();
            paymentData = adyenPaymentInstrument.custom.adyenPaymentData;
        }

        //details is either redirectResult or payload
        if (req.querystring.redirectResult) {
            details = {'redirectResult': req.querystring.redirectResult};
        } else if (req.querystring.payload) {
            details = {'payload': req.querystring.payload};
        }

        //redirect to payment/details
        var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
        var requestObject = {
            'details': details,
            'paymentData': paymentData
        };

        var result = adyenCheckout.doPaymentDetailsCall(requestObject);
        Transaction.wrap(function () {
            adyenPaymentInstrument.custom.adyenPaymentData = null;
        });

        // Authorised: The payment authorisation was successfully completed.
        if (result.resultCode == "Authorised" || result.resultCode == 'Pending' || result.resultCode == 'Received') {
            if (result.resultCode == "Received" && result.paymentMethod.indexOf("alipay_hk") > -1) {
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order);
                });
                Logger.getLogger("Adyen").error("Did not complete Alipay transaction, result: " + JSON.stringify(result));
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'payment', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
                return next();
            }

            //custom fraudDetection
            var fraudDetectionStatus = {status: 'success'};

            // Places the order
            var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
            if (placeOrderResult.error) {
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order);
                });
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'paymentError', Resource.msg('error.technical', 'checkout', null)));
                return next();
            }

            var OrderModel = require('*/cartridge/models/order');
            var Locale = require('dw/util/Locale');
            var currentLocale = Locale.getLocale(req.locale.id);
            var orderModel = new OrderModel(order, {countryCode: currentLocale.country});

            //Save orderModel to custom object during session
            Transaction.wrap(function () {
                order.custom.Adyen_CustomerEmail = JSON.stringify(orderModel);
                AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
            });

            clearForms();
            res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
            return next();
        } else {
            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
            });
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'paymentError', Resource.msg('error.technical', 'checkout', null)));
            return next();
        }
    }
    catch (e){
        Logger.getLogger("Adyen").error("Could not verify /payment/details: " + e.message);
        res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
        return next();
    }
});

server.post('ShowConfirmationPaymentFromComponent', server.middleware.https, function (req, res, next) {
    try {
        Logger.getLogger('Adyen').error('payment from component');
        var stateData = JSON.parse(req.form.additionalDetailsHidden);
        var order = OrderMgr.getOrder(session.privacy.orderNo);
        var paymentInstruments = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);
        var adyenPaymentInstrument;

        var paymentData = stateData.paymentData;
        var details = stateData.details;

        // looping through all Adyen payment methods, however, this only can be one.
        var instrumentsIter = paymentInstruments.iterator();
        while (instrumentsIter.hasNext()) {
            adyenPaymentInstrument = instrumentsIter.next();
        }

        //redirect to payment/details
        var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
        var requestObject = {
            'details': details,
            'paymentData': paymentData
        };

        var result = adyenCheckout.doPaymentDetailsCall(requestObject);
        Transaction.wrap(function () {
            adyenPaymentInstrument.custom.adyenPaymentData = null;
        });
        // Authorised: The payment authorisation was successfully completed.
        if (result.resultCode == "Authorised" || result.resultCode == 'Pending' || result.resultCode == 'Received') {
            //custom fraudDetection
            var fraudDetectionStatus = {status: 'success'};

            // Places the order
            var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
            if (placeOrderResult.error) {
                Transaction.wrap(function () {
                    OrderMgr.failOrder(order);
                });
                res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'paymentError', Resource.msg('error.technical', 'checkout', null)));
                return next();
            }

            var OrderModel = require('*/cartridge/models/order');
            var Locale = require('dw/util/Locale');
            var currentLocale = Locale.getLocale(req.locale.id);
            var orderModel = new OrderModel(order, {countryCode: currentLocale.country});

            //Save orderModel to custom object during session
            Transaction.wrap(function () {
                order.custom.Adyen_CustomerEmail = JSON.stringify(orderModel);
                AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
            });

            clearForms();
            res.redirect(URLUtils.https('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
            return next();
        } else {
            Transaction.wrap(function () {
                OrderMgr.failOrder(order, true);
            });
            res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'paymentError', Resource.msg('error.technical', 'checkout', null)));
            return next();
        }
    }
    catch (e){
        Logger.getLogger("Adyen").error("Could not verify /payment/details: " + e.message);
        res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
        return next();
    }
});

server.get("GetPaymentMethods", server.middleware.https, function (req, res, next) {
    var BasketMgr = require("dw/order/BasketMgr");
    var Resource = require("dw/web/Resource");
    var getPaymentMethods = require("*/cartridge/scripts/adyenGetPaymentMethods");
    var adyenTerminalApi = require("*/cartridge/scripts/adyenTerminalApi");
    var PaymentMgr = require("dw/order/PaymentMgr");
    var Locale = require("dw/util/Locale");

    var countryCode = Locale.getLocale(req.locale.id).country;
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket.getShipments().length > 0 && currentBasket.getShipments()[0].shippingAddress) {
        countryCode = currentBasket.getShipments()[0].shippingAddress.getCountryCode().value;
    }
    var response;
    var paymentMethodDescriptions = [];
    var customer;
    try {
        if(req.currentCustomer.profile) {
            customer = CustomerMgr.getCustomerByCustomerNumber(req.currentCustomer.profile.customerNo);
        }
        response = getPaymentMethods.getMethods(BasketMgr.getCurrentBasket(), customer ? customer : null, countryCode);
        paymentMethodDescriptions = response.paymentMethods.map(function (method) {
            return {
                brandCode: method.type,
                description: Resource.msg("hpp.description." + method.type, "hpp", "")
            };
        })
    } catch (err) {
        Logger.getLogger("Adyen").error("Error retrieving Payment Methods. Error message: " + err.message + " more details: "+ err.toString() + " in " + err.fileName + ":" + err.lineNumber);
        response = [];
        return next();
    }

    var connectedTerminals = {};
    if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive()) {
        connectedTerminals = adyenTerminalApi.getTerminals().response;
    }

    var adyenURL = AdyenHelper.getLoadingContext() + "images/logos/medium/";
    var jsonResponse = {
        AdyenPaymentMethods: response,
        ImagePath: adyenURL,
        AdyenDescriptions: paymentMethodDescriptions,
        AdyenConnectedTerminals: JSON.parse(connectedTerminals)
    };
    if(AdyenHelper.getCreditCardInstallments()) {
        var paymentAmount = currentBasket.getTotalGrossPrice() ? AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()) : 1000;
        var currency = currentBasket.getTotalGrossPrice().currencyCode;
        jsonResponse.amount = {value: paymentAmount, currency: currency};
        jsonResponse.countryCode = countryCode;
    }

    res.json(jsonResponse);
    return next();
});

/**
 * Make a payment from inside a component (paypal)
 */
server.post("PaymentFromComponent", server.middleware.https, function (req, res, next) {
    // var PaymentManager = require('dw/order/PaymentMgr');
    // var HookManager = require('dw/system/HookMgr');
    // var Resource = require('dw/web/Resource');
    // var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    //
    // var viewData = {};
    // var paymentForm = server.forms.getForm('billing');
    //
    // paymentForm.contactInfoFields.email.htmlValue = ' ';
    // // session.forms.billing.contactInfoFields.email.setHtmlValue('1111111');
    //
    // // verify billing form data
    // var billingFormErrors = COHelpers.validateBillingForm(paymentForm.addressFields);
    // var contactInfoFormErrors = COHelpers.validateFields(paymentForm.contactInfoFields);
    //
    // var formFieldErrors = [];
    // if (Object.keys(billingFormErrors).length) {
    //     formFieldErrors.push(billingFormErrors);
    // } else {
    //     viewData.address = {
    //         firstName: { value: paymentForm.addressFields.firstName.value },
    //         lastName: { value: paymentForm.addressFields.lastName.value },
    //         address1: { value: paymentForm.addressFields.address1.value },
    //         address2: { value: paymentForm.addressFields.address2.value },
    //         city: { value: paymentForm.addressFields.city.value },
    //         postalCode: { value: paymentForm.addressFields.postalCode.value },
    //         countryCode: { value: paymentForm.addressFields.country.value }
    //     };
    //
    //     if (Object.prototype.hasOwnProperty.call(paymentForm.addressFields, 'states')) {
    //         viewData.address.stateCode = { value: paymentForm.addressFields.states.stateCode.value };
    //     }
    // }
    //
    // if (Object.keys(contactInfoFormErrors).length) {
    //     formFieldErrors.push(contactInfoFormErrors);
    // } else {
    //     viewData.email = {
    //         value: paymentForm.contactInfoFields.email.value
    //     };
    //
    //     viewData.phone = { value: paymentForm.contactInfoFields.phone.value };
    // }
    //
    // var paymentMethodIdValue = paymentForm.paymentMethod.value;
    // var paymentMethodIdValue = "AdyenComponent";
    // if (!PaymentManager.getPaymentMethod(paymentMethodIdValue).paymentProcessor) {
    //     throw new Error(Resource.msg(
    //         'error.payment.processor.missing',
    //         'checkout',
    //         null
    //     ));
    // }
    //
    // var paymentProcessor = PaymentManager.getPaymentMethod(paymentMethodIdValue).getPaymentProcessor();
    //
    // var paymentFormResult;
    // if (HookManager.hasHook('app.payment.form.processor.' + paymentProcessor.ID.toLowerCase())) {
    //     paymentFormResult = HookManager.callHook('app.payment.form.processor.' + paymentProcessor.ID.toLowerCase(),
    //         'processForm',
    //         req,
    //         paymentForm,
    //         viewData
    //     );
    // } else {
    //     paymentFormResult = HookManager.callHook('app.payment.form.processor.default_form_processor', 'processForm');
    // }
    // if (paymentFormResult.error && paymentFormResult.fieldErrors) {
    //     formFieldErrors.push(paymentFormResult.fieldErrors);
    // }
    // if (formFieldErrors.length || paymentFormResult.serverErrors) {
    //     Logger.getLogger('Adyen').error('error');
    //
    //     // respond with form data and errors
    //     res.json({
    //         form: paymentForm,
    //         fieldErrors: formFieldErrors,
    //         serverErrors: paymentFormResult.serverErrors ? paymentFormResult.serverErrors : [],
    //         error: true
    //     });
    //     return next();
    // }
    // res.setViewData(paymentFormResult.viewData);
    //
    // this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
    //     var BasketMgr = require('dw/order/BasketMgr');
    //     var HookMgr = require('dw/system/HookMgr');
    //     var PaymentMgr = require('dw/order/PaymentMgr');
    //     var Transaction = require('dw/system/Transaction');
    //     var AccountModel = require('*/cartridge/models/account');
    //     var OrderModel = require('*/cartridge/models/order');
    //     var URLUtils = require('dw/web/URLUtils');
    //     var Locale = require('dw/util/Locale');
    //     var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    //     var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
    //     var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    //
    //     var currentBasket = BasketMgr.getCurrentBasket();
    //     var validatedProducts = validationHelpers.validateProducts(currentBasket);
    //
    //     var billingData = res.getViewData();
    //
    //     if (!currentBasket || validatedProducts.error) {
    //         delete billingData.paymentInformation;
    //
    //         res.json({
    //             error: true,
    //             cartError: true,
    //             fieldErrors: [],
    //             serverErrors: [],
    //             redirectUrl: URLUtils.url('Cart-Show').toString()
    //         });
    //         return;
    //     }
    //
    //     var billingAddress = currentBasket.billingAddress;
    //     var billingForm = server.forms.getForm('billing');
    //     var paymentMethodID = billingData.paymentMethod.value;
    //     var result;
    //
    //     billingForm.creditCardFields.cardNumber.htmlValue = '';
    //     billingForm.creditCardFields.securityCode.htmlValue = '';
    //
    //     Transaction.wrap(function () {
    //         if (!billingAddress) {
    //             billingAddress = currentBasket.createBillingAddress();
    //         }
    //
    //         billingAddress.setFirstName(billingData.address.firstName.value);
    //         billingAddress.setLastName(billingData.address.lastName.value);
    //         billingAddress.setAddress1(billingData.address.address1.value);
    //         billingAddress.setAddress2(billingData.address.address2.value);
    //         billingAddress.setCity(billingData.address.city.value);
    //         billingAddress.setPostalCode(billingData.address.postalCode.value);
    //         if (Object.prototype.hasOwnProperty.call(billingData.address, 'stateCode')) {
    //             billingAddress.setStateCode(billingData.address.stateCode.value);
    //         }
    //         billingAddress.setCountryCode(billingData.address.countryCode.value);
    //
    //         if (billingData.storedPaymentUUID) {
    //             billingAddress.setPhone(req.currentCustomer.profile.phone);
    //             currentBasket.setCustomerEmail(req.currentCustomer.profile.email);
    //         } else {
    //             billingAddress.setPhone(billingData.phone.value);
    //             currentBasket.setCustomerEmail(billingData.email.value);
    //         }
    //     });
    //
    //     // if there is no selected payment option and balance is greater than zero
    //     if (!paymentMethodID && currentBasket.totalGrossPrice.value > 0) {
    //         var noPaymentMethod = {};
    //
    //         noPaymentMethod[billingData.paymentMethod.htmlName] =
    //             Resource.msg('error.no.selected.payment.method', 'payment', null);
    //
    //         delete billingData.paymentInformation;
    //
    //         res.json({
    //             form: billingForm,
    //             fieldErrors: [noPaymentMethod],
    //             serverErrors: [],
    //             error: true
    //         });
    //         return;
    //     }
    //
    //     // check to make sure there is a payment processor
    //     if (!PaymentMgr.getPaymentMethod(paymentMethodID).paymentProcessor) {
    //         throw new Error(Resource.msg(
    //             'error.payment.processor.missing',
    //             'checkout',
    //             null
    //         ));
    //     }
    //
    //     var processor = PaymentMgr.getPaymentMethod(paymentMethodID).getPaymentProcessor();
    //
    //     if (HookMgr.hasHook('app.payment.processor.' + processor.ID.toLowerCase())) {
    //         result = HookMgr.callHook('app.payment.processor.' + processor.ID.toLowerCase(),
    //             'Handle',
    //             currentBasket,
    //             billingData.paymentInformation
    //         );
    //     } else {
    //         result = HookMgr.callHook('app.payment.processor.default', 'Handle');
    //     }
    //
    //     // need to invalidate credit card fields
    //     if (result.error) {
    //         delete billingData.paymentInformation;
    //
    //         res.json({
    //             form: billingForm,
    //             fieldErrors: result.fieldErrors,
    //             serverErrors: result.serverErrors,
    //             error: true
    //         });
    //         return;
    //     }
    //
    //     if (HookMgr.hasHook('app.payment.form.processor.' + processor.ID.toLowerCase())) {
    //         HookMgr.callHook('app.payment.form.processor.' + processor.ID.toLowerCase(),
    //             'savePaymentInformation',
    //             req,
    //             currentBasket,
    //             billingData
    //         );
    //     } else {
    //         HookMgr.callHook('app.payment.form.processor.default', 'savePaymentInformation');
    //     }
    //
    //     // Calculate the basket
    //     Transaction.wrap(function () {
    //         basketCalculationHelpers.calculateTotals(currentBasket);
    //     });
    //
    //     // Re-calculate the payments.
    //     var calculatedPaymentTransaction = COHelpers.calculatePaymentTransaction(
    //         currentBasket
    //     );
    //
    //     if (calculatedPaymentTransaction.error) {
    //         res.json({
    //             form: paymentForm,
    //             fieldErrors: [],
    //             serverErrors: [Resource.msg('error.technical', 'checkout', null)],
    //             error: true
    //         });
    //         return;
    //     }
    //
    //     var usingMultiShipping = req.session.privacyCache.get('usingMultiShipping');
    //     if (usingMultiShipping === true && currentBasket.shipments.length < 2) {
    //         req.session.privacyCache.set('usingMultiShipping', false);
    //         usingMultiShipping = false;
    //     }
    //
    //     hooksHelper('app.customer.subscription', 'subscribeTo', [paymentForm.subscribe.checked, paymentForm.contactInfoFields.email.htmlValue], function () {});
    //
    //     var currentLocale = Locale.getLocale(req.locale.id);
    //
    //     var basketModel = new OrderModel(
    //         currentBasket,
    //         { usingMultiShipping: usingMultiShipping, countryCode: currentLocale.country, containerView: 'basket' }
    //     );
    //
    //     var accountModel = new AccountModel(req.currentCustomer);
    //     var renderedStoredPaymentInstrument = COHelpers.getRenderedPaymentInstruments(
    //         req,
    //         accountModel
    //     );
    //
    //     delete billingData.paymentInformation;
    //
    //     res.json({
    //         renderedPaymentInstruments: renderedStoredPaymentInstrument,
    //         customer: accountModel,
    //         order: basketModel,
    //         form: billingForm,
    //         error: false
    //     });
    // });
    //
    // return next();



    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var BasketMgr = require("dw/order/BasketMgr");
    if(req.form.cancelPaypal) {
        var order = OrderMgr.getOrder(session.privacy.orderNo);
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
        });
        res.json({result: "cancelled"});
        return next();
    }
    var currentBasket = BasketMgr.getCurrentBasket();

    var paymentInstrument;
    Transaction.wrap(function () {
        collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
        currentBasket.removePaymentInstrument(item);
    });
        paymentInstrument = currentBasket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, currentBasket.totalGrossPrice);

        paymentInstrument.custom.adyenPaymentData = req.form.data;
        session.privacy.paymentMethod = paymentInstrument.paymentMethod;
        paymentInstrument.custom.adyenPaymentMethod = "paypal";
    });
    var order = COHelpers.createOrder(currentBasket);
    session.privacy.orderNo = order.orderNo;

    var result = adyenCheckout.createPaymentRequest({
        Order: order,
        PaymentInstrument: paymentInstrument
    });
    res.json(result);
    return next();
});

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */
server.post('Notify', server.middleware.https, function (req, res, next) {
    var checkAuth = require('*/cartridge/scripts/checkNotificationAuth');
    var status = checkAuth.check(req);
    if (!status) {
        res.render('/adyen/error');
        return {};
    }
    var handleNotify = require('*/cartridge/scripts/handleNotify');
    Transaction.begin();
    var notificationResult = handleNotify.notify(req.form);

    if (notificationResult.success) {
        Transaction.commit();
        res.render('/notify');
    } else {
        res.render('/notifyError', {
            errorMessage: notificationResult.errorMessage
        });
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
    session.privacy.paymentMethod = null;
    session.privacy.orderNo = null;
    session.privacy.brandCode = null;
    session.privacy.issuer = null;
    session.privacy.adyenPaymentMethod = null;
    session.privacy.adyenIssuerName = null;
    session.privacy.ratePayFingerprint = null;
}

function getExternalPlatformVersion() {
    return EXTERNAL_PLATFORM_VERSION;
}

module.exports = server.exports();

module.exports.getExternalPlatformVersion = getExternalPlatformVersion();