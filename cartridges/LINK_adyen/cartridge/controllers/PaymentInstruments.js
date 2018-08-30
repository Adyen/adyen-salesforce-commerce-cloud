'use strict';

var server = require('server');
server.extend(module.superModule);

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var AdyenHelper = require ("int_adyen/cartridge/scripts/util/AdyenHelper");

server.prepend('List', userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
    require('int_adyen/cartridge/scripts/UpdateSavedCards').updateSavedCards({CurrentCustomer : req.currentCustomer.raw});
    next();
});

server.replace('DeletePayment', userLoggedIn.validateLoggedInAjax, function (req, res, next) {
    var array = require('*/cartridge/scripts/util/array');

    var data = res.getViewData();
    if (data && !data.loggedin) {
        res.json();
        return next();
    }

    var UUID = req.querystring.UUID;
    var paymentInstruments = req.currentCustomer.wallet.paymentInstruments;

    var paymentToDelete = array.find(paymentInstruments, function (item) {
        return UUID === item.UUID;
    });

    res.setViewData(paymentToDelete);

    this.on('route:BeforeComplete', function () { // eslint-disable-line no-shadow
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Transaction = require('dw/system/Transaction');
        var Resource = require('dw/web/Resource');

        var payment = res.getViewData();
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );

        var wallet = customer.getProfile().getWallet();

        if(!empty(payment)){
            var tokenToDelete = AdyenHelper.getCardToken(UUID, customer);
            if  (!empty(tokenToDelete)){
                var  result  = require('int_adyen/cartridge/scripts/adyenDeleteRecurringPayment').deleteRecurringPayment({
                    Customer:  customer,
                    RecurringDetailReference:  tokenToDelete
                });
                if   (result   ==   PIPELET_NEXT)  {
                    Transaction.wrap(function () {
                        wallet.removePaymentInstrument(payment.raw);
                    });
                }
            }
            else {
                Transaction.wrap(function () {
                    wallet.removePaymentInstrument(payment.raw);
                });
            }
        }

        if (wallet.getPaymentInstruments().length === 0) {
            res.json({
                UUID: UUID,
                message: Resource.msg('msg.no.saved.payments', 'payment', null)
            });
        } else {
            res.json({ UUID: UUID });
        }
    });

    return next();
});


module.exports = server.exports();
