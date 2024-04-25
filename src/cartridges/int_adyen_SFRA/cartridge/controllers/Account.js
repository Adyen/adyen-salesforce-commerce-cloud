const server = require('server');
const {
  updateSavedCards,
} = require('*/cartridge/adyen/scripts/payments/updateSavedCards');

server.extend(module.superModule);

const userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
const consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/*
 * Prepends Account's 'Show' function to update saved cards.
 */
server.prepend(
  'Show',
  server.middleware.https,
  userLoggedIn.validateLoggedIn,
  consentTracking.consent,
  (req, res, next) => {
    updateSavedCards({
      CurrentCustomer: req.currentCustomer.raw,
    });
    next();
  },
);

module.exports = server.exports();
