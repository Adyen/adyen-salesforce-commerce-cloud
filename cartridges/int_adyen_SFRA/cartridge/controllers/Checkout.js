"use strict";

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var _require = require('./middlewares/index'),
    checkout = _require.checkout;

server.extend(module.superModule);
server.prepend('Begin', server.middleware.https, consentTracking.consent, csrfProtection.generateToken, checkout.begin);
module.exports = server.exports();