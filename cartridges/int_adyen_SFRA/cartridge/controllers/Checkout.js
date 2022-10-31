"use strict";

var server = require('server');
var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var _require = require('*/cartridge/controllers/middlewares/index'),
  checkout = _require.checkout;
server.extend(module.superModule);

/*
 * Prepends Checkout's 'Begin' function with Adyen-specific configuration.
 */
server.prepend('Begin', server.middleware.https, consentTracking.consent, csrfProtection.generateToken, checkout.begin);
module.exports = server.exports();