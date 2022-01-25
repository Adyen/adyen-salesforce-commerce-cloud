const server = require('server');
const consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
const adyenGiving = require('*/cartridge/scripts/adyenGiving');
const { adyen } = require('*/cartridge/controllers/middlewares/index');

const EXTERNAL_PLATFORM_VERSION = 'SFRA';

/**
 * Show confirmation after return from Adyen
 */
server.get('ShowConfirmation', server.middleware.https, adyen.showConfirmation);

/**
 *  Confirm payment status after receiving redirectResult from Adyen
 */
server.post(
  'PaymentsDetails',
  server.middleware.https,
  consentTracking.consent,
  adyen.paymentsDetails,
);

server.get('Sessions', server.middleware.https, adyen.callCreateSession);

/**
 * Redirect to Adyen after 3DS1 Authentication When adding a card to an account
 */
server.get(
  'Redirect3DS1Response',
  server.middleware.https,
  adyen.redirect3ds1Response,
);

/**
 * Show confirmation for payments completed from component directly e.g. paypal, QRcode, ..
 */
server.post(
  'ShowConfirmationPaymentFromComponent',
  server.middleware.https,
  adyen.showConfirmationPaymentFromComponent,
);

/**
 * Complete a donation through adyenGiving
 */
server.post('Donate', server.middleware.https, (req /* , res, next */) => {
  const { pspReference } = req.form;
  const { orderNo } = req.form;
  const donationAmount = {
    value: req.form.amountValue,
    currency: req.form.amountCurrency,
  };
  const donationResult = adyenGiving.donate(
    orderNo,
    donationAmount,
    pspReference,
  );

  return donationResult.response;
});

/**
 * Make a payment from inside a component (paypal)
 */
server.post(
  'PaymentFromComponent',
  server.middleware.https,
  adyen.paymentFromComponent,
);

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */
server.post('Notify', server.middleware.https, adyen.notify);

function getExternalPlatformVersion() {
  return EXTERNAL_PLATFORM_VERSION;
}

module.exports = server.exports();

module.exports.getExternalPlatformVersion = getExternalPlatformVersion();
