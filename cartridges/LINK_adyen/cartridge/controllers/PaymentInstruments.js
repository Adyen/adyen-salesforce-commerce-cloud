'use strict';

var server = require('server');
server.extend(module.superModule);

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var AdyenHelper = require ("int_adyen/cartridge/scripts/util/AdyenHelper");
var Logger = require('dw/system/Logger');

server.prepend('List', userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
    require('int_adyen/cartridge/scripts/UpdateSavedCards').updateSavedCards({CurrentCustomer : req.currentCustomer.raw});
    next();
});

function getEncryptedData(){
    var paymentForm = server.forms.getForm('creditCard');
    return paymentForm.adyenEncryptedData.value;
}

/**
 * Creates an object from form values
 * @param {Object} paymentForm - form object
 * @returns {Object} a plain object of payment instrument
 */
function getDetailsObject(paymentForm) {
    return {
        name: paymentForm.cardOwner.value,
        cardNumber: paymentForm.cardNumber.value,
        cardType: paymentForm.cardType.value,
        expirationMonth: paymentForm.expirationMonth.value,
        expirationYear: paymentForm.expirationYear.value,
        paymentForm: paymentForm
    };
}

server.replace('SavePayment', csrfProtection.validateAjaxRequest, function (req, res, next) {
    var formErrors = require('*/cartridge/scripts/formErrors');
    var viewData = res.getViewData();
    viewData.adyenEncryptedData =  getEncryptedData();
    res.setViewData(viewData);

    var paymentForm = server.forms.getForm('creditCard');
    var result = getDetailsObject(paymentForm);

    if (paymentForm.valid) {
        res.setViewData(result);
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var URLUtils = require('dw/web/URLUtils');
            var CustomerMgr = require('dw/customer/CustomerMgr');

            var customer = CustomerMgr.getCustomerByCustomerNumber(
                req.currentCustomer.profile.customerNo
            );

            var createRecurringPaymentAccountResult = AdyenHelper.createRecurringPaymentAccount({
                Customer: customer
            });

            if (createRecurringPaymentAccountResult.error) {
                res.json({
                    success: false,
                    fields: formErrors.getFormErrors(paymentForm)
                });
            }

            res.json({
                success: true,
                redirectUrl: URLUtils.url('PaymentInstruments-List').toString()
            });
        });
    } else {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(paymentForm)
        });
    }
    return next();
});

server.append('DeletePayment', userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var payment = res.getViewData();

    if(!empty(payment)){
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        var tokenToDelete = AdyenHelper.getCardToken(payment.UUID, customer);
        Logger.getLogger("Adyen").error("tokenToDelete = " + tokenToDelete);
        if  (!empty(tokenToDelete)) {
            var result = require('int_adyen/cartridge/scripts/adyenDeleteRecurringPayment').deleteRecurringPayment({
                Customer: customer,
                RecurringDetailReference: tokenToDelete
            });
        }
    }

return next();
});


module.exports = server.exports();
