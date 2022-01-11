"use strict";

var server = require('server');

var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');

var adyenGiving = require('*/cartridge/scripts/adyenGiving');

var _require = require('./middlewares/index'),
    adyen = _require.adyen;

var EXTERNAL_PLATFORM_VERSION = 'SFRA';
/**
 * Complete a 3DS payment
 */

server.use('Adyen3D', csrfProtection.generateToken, server.middleware.https, adyen.adyen3d);
/**
 * Make /payments/details call to 3d verification system to complete authorization
 */

server.post('AuthorizeWithForm', csrfProtection.generateToken, server.middleware.https, adyen.authorizeWithForm);
/**
 * Complete a 3DS2 payment
 */

server.use('Adyen3DS2', consentTracking.consent, csrfProtection.generateToken, server.middleware.https, adyen.adyen3ds2);
/**
 * Make second call to /payments/details with IdentifyShopper or ChallengeShopper token
 *
 * @returns rendering template or error
 */

server.post('Authorize3DS2', csrfProtection.generateToken, csrfProtection.validateRequest, server.middleware.https, adyen.authorize3ds2);
/**
 * Redirect to Adyen after saving order etc.
 */

server.use('Redirect', server.middleware.https, adyen.redirect);
/**
 * Show confirmation after return from Adyen
 */

server.get('ShowConfirmation', server.middleware.https, adyen.showConfirmation);
/**
 *  Confirm payment status after receiving redirectResult from Adyen
 */

server.post('PaymentsDetails', server.middleware.https, adyen.paymentsDetails);
/**
 * Redirect to Adyen after 3DS1 Authentication When adding a card to an account
 */

server.get('Redirect3DS1Response', server.middleware.https, adyen.redirect3ds1Response);
/**
 * Show confirmation for payments completed from component directly e.g. paypal, QRcode, ..
 */

server.post('ShowConfirmationPaymentFromComponent', server.middleware.https, adyen.showConfirmationPaymentFromComponent);
/**
 * Make a request to Adyen to get payment methods based on countryCode
 */

server.get('GetPaymentMethods', server.middleware.https, adyen.getPaymentMethods);
/**
 * Complete a donation through adyenGiving
 */

server.post('Donate', server.middleware.https, function (req
/* , res, next */
) {
  var pspReference = req.form.pspReference;
  var orderNo = req.form.orderNo;
  var donationAmount = {
    value: req.form.amountValue,
    currency: req.form.amountCurrency
  };
  var donationResult = adyenGiving.donate(orderNo, donationAmount, pspReference);
  return donationResult.response;
});
/**
 * Make a payment from inside a component (paypal)
 */

server.post('PaymentFromComponent', server.middleware.https, adyen.paymentFromComponent);
/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */

server.post('Notify', server.middleware.https, adyen.notify);

function getExternalPlatformVersion() {
  return EXTERNAL_PLATFORM_VERSION;
}

module.exports = server.exports();
module.exports.getExternalPlatformVersion = getExternalPlatformVersion();