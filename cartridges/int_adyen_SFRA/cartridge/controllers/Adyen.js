"use strict";

var server = require('server');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var adyenGiving = require('*/cartridge/scripts/adyenGiving');
var _require = require('*/cartridge/controllers/middlewares/index'),
  adyen = _require.adyen;
var EXTERNAL_PLATFORM_VERSION = 'SFRA';

/**
 * Show confirmation after return from Adyen
 */
server.get('ShowConfirmation', server.middleware.https, adyen.showConfirmation);

/**
 *  Confirm payment status after receiving redirectResult from Adyen
 */
server.post('PaymentsDetails', server.middleware.https, consentTracking.consent, adyen.paymentsDetails);
server.get('Sessions', server.middleware.https, adyen.callCreateSession);
server.get('ShippingMethods', server.middleware.https, adyen.callGetShippingMethods);
server.post('SelectShippingMethod', server.middleware.https, adyen.callSelectShippingMethod);

/**
 * Redirect to Adyen after 3DS1 Authentication When adding a card to an account
 */
server.get('Redirect3DS1Response', server.middleware.https, adyen.redirect3ds1Response);

/**
 * Show confirmation for payments completed from component directly e.g. paypal, QRcode, ..
 */
server.post('ShowConfirmationPaymentFromComponent', server.middleware.https, adyen.showConfirmationPaymentFromComponent);

/**
 * Complete a donation through adyenGiving
 */
server.post('Donate', server.middleware.https, function (req /* , res, next */) {
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
 *  Save shopper details that came from an Express component in the SFCC session
 */
server.post('SaveExpressShopperDetails', server.middleware.https, adyen.saveExpressShopperDetails);
server.get('GetPaymentMethods', server.middleware.https, adyen.getCheckoutPaymentMethods);

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */
server.post('Notify', server.middleware.https, adyen.notify);

/**
 * Called by Adyen to check balance of gift card.
 */
server.post('CheckBalance', server.middleware.https, adyen.checkBalance);

/**
 * Called by Adyen to cancel a partial payment order.
 */
server.post('CancelPartialPaymentOrder', server.middleware.https, adyen.cancelPartialPaymentOrder);

/**
 * Called by Adyen to create a partial payments order
 */
server.post('PartialPaymentsOrder', server.middleware.https, adyen.partialPaymentsOrder);

/**
 * Called by Adyen to apply a giftcard
 */
server.post('partialPayment', server.middleware.https, adyen.partialPayment);

/**
 * Called by Adyen to fetch applied giftcards
 */
server.get('fetchGiftCards', server.middleware.https, adyen.fetchGiftCards);
function getExternalPlatformVersion() {
  return EXTERNAL_PLATFORM_VERSION;
}
module.exports = server.exports();
module.exports.getExternalPlatformVersion = getExternalPlatformVersion();