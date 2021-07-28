"use strict";

var server = require('server');

server.extend(module.superModule);

var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');

var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

var adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var _require = require('*/cartridge/scripts/updateSavedCards'),
    updateSavedCards = _require.updateSavedCards;

var _require2 = require('./middlewares/index'),
    paymentInstruments = _require2.paymentInstruments;
/*
 * Prepends PaymentInstruments' 'List' function to list saved cards.
 */


server.prepend('List', userLoggedIn.validateLoggedIn, consentTracking.consent, function (req, res, next) {
  updateSavedCards({
    CurrentCustomer: req.currentCustomer.raw
  });
  next();
});
/*
 * Prepends PaymentInstruments' 'AddPayment' function to pass Adyen-specific configurations.
 */

server.prepend('AddPayment', csrfProtection.generateToken, consentTracking.consent, userLoggedIn.validateLoggedIn, function (req, res, next) {
  var protocol = req.https ? 'https' : 'http';
  var originKey = adyenGetOriginKey.getOriginKeyFromRequest(protocol, req.host);
  var environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
  var viewData = res.getViewData();
  viewData.adyen = {
    originKey: originKey,
    environment: environment
  };
  res.setViewData(viewData);
  next();
});
/*
 * Prepends PaymentInstruments' 'SavePayment' function to handle saving a payment instrument
 *  when the selected payment processor is Adyen.
 */

server.prepend('SavePayment', csrfProtection.validateAjaxRequest, paymentInstruments.savePayment);
/*
 * Prepends PaymentInstruments' 'DeletePayment' function to handle deleting a payment instrument
 *  when the selected payment processor is Adyen.
 */

server.append('DeletePayment', userLoggedIn.validateLoggedInAjax, paymentInstruments.deletePayment);
module.exports = server.exports();