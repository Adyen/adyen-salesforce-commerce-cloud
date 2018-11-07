'use strict';
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var server = require('server');
server.extend(module.superModule);

server.prepend('Begin',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) {
        if (req.currentCustomer.raw.isAuthenticated()) {
            require('int_adyen_overlay/cartridge/scripts/UpdateSavedCards').updateSavedCards({CurrentCustomer: req.currentCustomer.raw});
        }
        next();
    });

module.exports = server.exports();
