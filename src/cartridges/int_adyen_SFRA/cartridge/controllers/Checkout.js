const server = require('server');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
const { checkout } = require('*/cartridge/controllers/middlewares/index');

server.extend(module.superModule);

/*
 * Prepends Checkout's 'Begin' function with Adyen-specific configuration.
 */
server.prepend(
  'Begin',
  server.middleware.https,
  consentTracking.consent,
  csrfProtection.generateToken,
  checkout.begin,
);

module.exports = server.exports();
