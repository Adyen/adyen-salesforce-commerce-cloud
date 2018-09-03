'use strict';

var server = require('server');
server.extend(module.superModule);

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var AdyenHelper = require ("int_adyen/cartridge/scripts/util/AdyenHelper");
var Logger = require('dw/system/Logger');

server.prepend('List', userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
    require('int_adyen/cartridge/scripts/UpdateSavedCards').updateSavedCards({CurrentCustomer : req.currentCustomer.raw});
    next();
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
