'use strict';

var server = require("server");
server.extend(module.superModule);

var userLoggedIn = require("*/cartridge/scripts/middleware/userLoggedIn");
var consentTracking = require("*/cartridge/scripts/middleware/consentTracking");
var csrfProtection = require("*/cartridge/scripts/middleware/csrf");
var adyenGetOriginKey = require("*/cartridge/scripts/adyenGetOriginKey");
var AdyenHelper = require("*/cartridge/scripts/util/AdyenHelper");
var constants = require("*/cartridge/adyenConstants/constants");
var adyenZeroAuth = require("*/cartridge/scripts/adyenZeroAuth");
var Resource = require("dw/web/Resource");

server.prepend('List', userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
    require("*/cartridge/scripts/updateSavedCards").updateSavedCards({CurrentCustomer: req.currentCustomer.raw});
    next();
});

server.prepend('AddPayment',  csrfProtection.generateToken, consentTracking.consent, userLoggedIn.validateLoggedIn, function (req, res, next) {
    var protocol = req.https ? "https" : "http";
    var originKey = adyenGetOriginKey.getOriginKeyFromRequest(protocol, req.host);
    var environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
    var viewData = res.getViewData();
    viewData.adyen = {
        originKey: originKey,
        environment: environment
    };

    res.setViewData(viewData);
    next();
});

server.replace('SavePayment', csrfProtection.validateAjaxRequest, function (req, res, next) {
    var CustomerMgr = require("dw/customer/CustomerMgr");
    var Transaction = require("dw/system/Transaction");
    var URLUtils = require("dw/web/URLUtils");
    var accountHelpers = require("*/cartridge/scripts/helpers/accountHelpers");

    var paymentForm = server.forms.getForm("creditCard");
    var customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo
    );

    var paymentInstrument;
    var wallet = customer.getProfile().getWallet();
    Transaction.wrap(function () {
        paymentInstrument = wallet.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT);
        paymentInstrument.custom.adyenPaymentData = paymentForm.adyenStateData.value;
    });

    Transaction.begin();
    var zeroAuthResult = adyenZeroAuth.zeroAuthPayment(customer, paymentInstrument);
    if(zeroAuthResult.error || zeroAuthResult.resultCode !== "Authorised"){
        Transaction.rollback();
        res.json({
            success: false,
            error: [Resource.msg("error.card.information.error", "creditCard", null)]
        });
        return next();
    }
    Transaction.commit();

    require("*/cartridge/scripts/updateSavedCards").updateSavedCards({CurrentCustomer: req.currentCustomer.raw});

    // Send account edited email
    accountHelpers.sendAccountEditedEmail(customer.profile);

    res.json({
        success: true,
        redirectUrl: URLUtils.url("PaymentInstruments-List").toString()
    });
    return next();
});

server.append('DeletePayment', userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    var CustomerMgr = require("dw/customer/CustomerMgr");
    var payment = res.getViewData();

    if (payment) {
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        var tokenToDelete = AdyenHelper.getCardToken(payment.UUID, customer);
        if (tokenToDelete) {
            var result = require("*/cartridge/scripts/adyenDeleteRecurringPayment").deleteRecurringPayment({
                Customer: customer,
                RecurringDetailReference: tokenToDelete
            });
        }
    }

    return next();
});


module.exports = server.exports();
