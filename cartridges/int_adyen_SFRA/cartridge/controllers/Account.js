"use strict";

var server = require('server');
var _require = require('*/cartridge/adyen/scripts/payments/updateSavedCards'),
  updateSavedCards = _require.updateSavedCards;
server.extend(module.superModule);
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/*
 * Prepends Account's 'Show' function to update saved cards.
 */
server.prepend('Show', server.middleware.https, userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
  updateSavedCards({
    CurrentCustomer: req.currentCustomer.raw
  });
  next();
});
module.exports = server.exports();