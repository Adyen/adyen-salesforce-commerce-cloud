import * as middlewares from './middlewares';
import { clearForms } from './utils';

const server = require('server');
const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
// eslint-disable-next-line no-unused-vars
const OrderMgr = require('dw/order/OrderMgr');
const CustomerMgr = require('dw/customer/CustomerMgr');
const Resource = require('dw/web/Resource');
// eslint-disable-next-line no-unused-vars
const Site = require('dw/system/Site');
const Logger = require('dw/system/Logger');
const PaymentMgr = require('dw/order/PaymentMgr');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const constants = require('*/cartridge/adyenConstants/constants');
const collections = require('*/cartridge/scripts/util/collections');
const adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
const csrfProtection = require('*/cartridge/scripts/middleware/csrf');

const EXTERNAL_PLATFORM_VERSION = 'SFRA';

/**
 * Complete a 3DS payment
 */
server.get(
  'Adyen3D',
  csrfProtection.generateToken,
  server.middleware.https,
  (req, res, next) => {
    const { IssuerURL } = req.querystring;
    const { PaRequest } = req.querystring;
    const { MD } = req.querystring;
    const TermURL = URLUtils.https('Adyen-AuthorizeWithForm');

    res.render('adyenform', {
      issuerUrl: IssuerURL,
      paRequest: PaRequest,
      md: MD,
      ContinueURL: TermURL,
    });
    next();
  },
);

/**
 * Make /payments/details call to 3d verification system to complete authorization
 */
server.post(
  'AuthorizeWithForm',
  csrfProtection.generateToken,
  server.middleware.https,
  middlewares.authorizeWithForm,
);

/**
 * Complete a 3DS2 payment
 */
server.get(
  'Adyen3DS2',
  consentTracking.consent,
  csrfProtection.generateToken,
  server.middleware.https,
  middlewares.adyen3ds2,
);

/**
 * Make second call to /payments/details with IdentifyShopper or ChallengeShopper token
 *
 * @returns rendering template or error
 */
server.post(
  'Authorize3DS2',
  csrfProtection.generateToken,
  csrfProtection.validateRequest,
  server.middleware.https,
  middlewares.authorize3ds2,
);

/**
 * Redirect to Adyen after saving order etc.
 */
server.get('Redirect', server.middleware.https, middlewares.redirect);

/**
 * Show confirmation after return from Adyen
 */
server.get(
  'ShowConfirmation',
  server.middleware.https,
  middlewares.showConfirmation,
);

/**
 * Show confirmation for payments completed from component directly e.g. paypal, QRcode, ..
 */
server.post(
  'ShowConfirmationPaymentFromComponent',
  server.middleware.https,
  middlewares.showConfirmationPaymentFromComponent,
);

/**
 * Make a request to Adyen to get payment methods based on countryCode
 */
server.get(
  'GetPaymentMethods',
  server.middleware.https,
  middlewares.getPaymentMethods,
);

/**
 * Complete a donation through adyenGiving
 */
server.post('Donate', server.middleware.https, (req /* , res, next */) => {
  const adyenGiving = require('*/cartridge/scripts/adyenGiving');
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
  middlewares.paymentFromComponent,
);

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */
server.post('Notify', server.middleware.https, middlewares.notify);

function getExternalPlatformVersion() {
  return EXTERNAL_PLATFORM_VERSION;
}

module.exports = server.exports();

module.exports.getExternalPlatformVersion = getExternalPlatformVersion();
