'use strict';
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');
var AdyenHelper = require('*/cartridge/scripts/util/AdyenHelper');
var Logger = require('dw/system/Logger');

var server = require('server');
server.extend(module.superModule);

server.prepend('Begin', server.middleware.https, consentTracking.consent, csrfProtection.generateToken, function (req, res, next) {
        if (req.currentCustomer.raw.isAuthenticated()) {
            require('*/cartridge/scripts/updateSavedCards').updateSavedCards({CurrentCustomer: req.currentCustomer.raw});
        }

        Logger.getLogger("Adyen").error("BeginCheckout");
        var protocol = req.https ? "https" : "http";
        var originKey = adyenGetOriginKey.getOriginKeyFromRequest(protocol, req.host);
        var environment = AdyenHelper.getAdyenMode().toLowerCase();
        var installments = AdyenHelper.getCreditCardInstallments();

        var viewData = res.getViewData();
        viewData.adyen = {
            originKey : originKey,
            environment: environment,
            installments: installments
        };
        Logger.getLogger("Adyen").error("EndBeginCheckout");
        res.setViewData(viewData);
        next();
    });

module.exports = server.exports();
