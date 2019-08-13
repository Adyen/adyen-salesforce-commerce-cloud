'use strict';

var server = require('server');
server.extend(module.superModule);

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

var AdyenHelper = require('*/cartridge/scripts/util/AdyenHelper');

server.prepend('List', userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
    require('*/cartridge/scripts/updateSavedCards').updateSavedCards({CurrentCustomer: req.currentCustomer.raw});
    next();
});

server.replace('SavePayment', csrfProtection.validateAjaxRequest, function (req, res, next) {
    var viewData = res.getViewData();
    var paymentForm = server.forms.getForm('creditCard');

    viewData.adyenEncryptedCardNumber = paymentForm.adyenEncryptedCardNumber.value;
    viewData.adyenEncryptedExpiryMonth = paymentForm.adyenEncryptedExpiryMonth.value;
    viewData.adyenEncryptedExpiryYear = paymentForm.adyenEncryptedExpiryYear.value;
    viewData.adyenEncryptedSecurityCode = paymentForm.adyenEncryptedSecurityCode.value;
    viewData.browserInfo = paymentForm.browserInfo.value;
    res.setViewData(viewData);

    if (paymentForm.valid) {
        this.on('route:BeforeComplete', function (req, res) {
            var URLUtils = require('dw/web/URLUtils');
            var CustomerMgr = require('dw/customer/CustomerMgr');
            var Resource = require('dw/web/Resource');

            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );

            var createRecurringPaymentAccountResult = AdyenHelper.createRecurringPaymentAccount({
                Customer: customer
            });

            if (createRecurringPaymentAccountResult.error) {
                res.json({
                    success: false,
                    error: [Resource.msg('error.card.information.error', 'creditCard', null)]
                });
            } else {
                res.json({
                    success: true,
                    redirectUrl: URLUtils.url('PaymentInstruments-List').toString()
                });
            }
        });
    } else {
        res.json({
            success: false,
            error: [Resource.msg('error.card.information.error', 'creditCard', null)]
        });
    }
    return next();
});

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
