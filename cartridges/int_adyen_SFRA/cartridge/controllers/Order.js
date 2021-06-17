"use strict";

var server = require('server');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var _require = require('./middlewares/index'),
    order = _require.order;

server.extend(module.superModule);
server.prepend('Confirm', server.middleware.https, consentTracking.consent, csrfProtection.generateToken, order.confirm);
module.exports = server.exports();