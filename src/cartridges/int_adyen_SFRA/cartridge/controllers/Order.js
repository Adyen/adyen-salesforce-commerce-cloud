const server = require('server');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');
const consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
const { order } = require('./middlewares/index');

server.extend(module.superModule);

server.prepend(
  'Confirm',
  server.middleware.https,
  consentTracking.consent,
  csrfProtection.generateToken,
  order.confirm,
);

module.exports = server.exports();
