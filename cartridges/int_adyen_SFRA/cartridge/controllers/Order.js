'use strict';
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var OrderMgr = require('dw/order/OrderMgr');
var adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');
var AdyenHelper = require('*/cartridge/scripts/util/AdyenHelper');

var server = require('server');
server.extend(module.superModule);

server.prepend('Confirm', server.middleware.https, consentTracking.consent, csrfProtection.generateToken, function (req, res, next) {
        var protocol = req.https ? "https" : "http";
        var originKey = adyenGetOriginKey.getOriginKeyFromRequest(protocol, req.host);
        var environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
        var configuredAmounts = [300, 500, 1000]; // TODOBAS AdyenHelper.getDonationAmounts();

        var donationAmounts = {
            currency: session.currency.currencyCode,
            values: configuredAmounts
        };

        var order = OrderMgr.getOrder(req.querystring.ID);
        var viewData = res.getViewData();
        viewData.adyen = {
            originKey : originKey,
            environment: environment,
            pspReference: order.custom.Adyen_pspReference,
            donationAmounts: JSON.stringify(donationAmounts)
        };

        res.setViewData(viewData);
        next();
    });

module.exports = server.exports();
