'use strict';

var server = require('server');
server.extend(module.superModule);

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');
var AdyenHelper = require('*/cartridge/scripts/util/AdyenHelper');
var Logger = require('dw/system/Logger');
var constants = require("*/cartridge/adyenConstants/constants");

server.prepend('List', userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
    require('*/cartridge/scripts/updateSavedCards').updateSavedCards({CurrentCustomer: req.currentCustomer.raw});
    next();
});

server.prepend('AddPayment',  csrfProtection.generateToken, consentTracking.consent, userLoggedIn.validateLoggedIn, function (req, res, next) {
    Logger.getLogger("Adyen").error("AddPayment start");
    if(!AdyenHelper.getAdyen3DS2Enabled()){
        var protocol = req.https ? "https" : "http";
        var originKey = adyenGetOriginKey.getOriginKeyFromRequest(protocol, req.host);
        var environment = AdyenHelper.getAdyenMode().toLowerCase();

        var viewData = res.getViewData();
        viewData.adyen = {
            originKey : originKey,
            environment: environment
        };

        res.setViewData(viewData);
    }
    next();
});

server.replace('SavePayment', csrfProtection.validateAjaxRequest, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var URLUtils = require('dw/web/URLUtils');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');

    var viewData = res.getViewData();
    Logger.getLogger("Adyen").error("save payment viewData = " + JSON.stringify(viewData));
    var paymentForm = server.forms.getForm('creditCard');
    var paymentInstrument;
    Logger.getLogger("Adyen").error("save .adyenStateData.value = " + JSON.stringify(paymentForm.adyenStateData.value));
    viewData.adyenStateData = paymentForm.adyenStateData.value;
    res.setViewData(viewData);

    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );
    var wallet = customer.getProfile().getWallet();
    Transaction.wrap(function () {
        paymentInstrument = wallet.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT);
        paymentInstrument.custom.adyenPaymentData = paymentForm.adyenStateData.value;
    });

    //Zero auth does not have an order, hence the null value
    var zeroAuthRequest = AdyenHelper.createAdyenRequestObject(null, paymentInstrument);

    if(AdyenHelper.getAdyen3DS2Enabled()){
        zeroAuthRequest = AdyenHelper.add3DS2Data(zeroAuthRequest);
    }

    zeroAuthRequest["amount"] = {
        "currency": session.currency.currencyCode,
        "value": 0
    };

    //Send payment request to /payments endpoints
    var adyenCheckout = require("*/cartridge/scripts/adyenCheckout.ds");
    var zeroAuthResult = adyenCheckout.doPaymentCall(null, paymentInstrument, zeroAuthRequest);

    if(zeroAuthResult.error || zeroAuthResult.resultCode !== "Authorised"){
        res.json({
            success: false,
            error: [Resource.msg('error.card.information.error', 'creditCard', null)]
        });
        return next();
    }

    //TODO BAS
    // Update saved cards with /paymentMethods call

    // Send account edited email
    accountHelpers.sendAccountEditedEmail(customer.profile);

    res.json({
        success: true,
        redirectUrl: URLUtils.url('PaymentInstruments-List').toString()
    });
    return next();
});

    // if (paymentForm.valid) {
    //     this.on('route:BeforeComplete', function (req, res) {
    //         var URLUtils = require('dw/web/URLUtils');
    //         var CustomerMgr = require('dw/customer/CustomerMgr');
    //         var Resource = require('dw/web/Resource');
    //
    //         var customer = CustomerMgr.getCustomerByCustomerNumber(
    //             req.currentCustomer.profile.customerNo
    //         );
    //
    //         var createRecurringPaymentAccountResult = AdyenHelper.createRecurringPaymentAccount({
    //             Customer: customer
    //         });
    //
    //         if (createRecurringPaymentAccountResult.error) {
    //             res.json({
    //                 success: false,
    //                 error: [Resource.msg('error.card.information.error', 'creditCard', null)]
    //             });
    //         } else {
    //             res.json({
    //                 success: true,
    //                 redirectUrl: URLUtils.url('PaymentInstruments-List').toString()
    //             });
    //         }
    //     });
    // } else {
    //     res.json({
    //         success: false,
    //         error: [Resource.msg('error.card.information.error', 'creditCard', null)]
    //     });
    // }
//     return next();
// });

server.append('DeletePayment', userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var payment = res.getViewData();


    if (!empty(payment)) {
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        var tokenToDelete = AdyenHelper.getCardToken(payment.UUID, customer);
        if (!empty(tokenToDelete)) {
            var result = require('*/cartridge/scripts/adyenDeleteRecurringPayment').deleteRecurringPayment({
                Customer: customer,
                RecurringDetailReference: tokenToDelete
            });
        }
    }

    return next();
});


module.exports = server.exports();
