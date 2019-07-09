'use strict';

var server = require('server');
server.extend(module.superModule);

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

server.append(
    'Show',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        require('*/cartridge/scripts/UpdateSavedCards').updateSavedCards({CurrentCustomer: req.currentCustomer.raw});
        next();
    }
);

module.exports = server.exports();
