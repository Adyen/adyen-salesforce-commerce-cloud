const server = require('server');
const adyenGiving = require('*/cartridge/adyen/scripts/donations/adyenGiving');
const { adyen } = require('*/cartridge/controllers/middlewares/index');
const csrf = require('*/cartridge/scripts/middleware/csrf');

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
  csrf.validateRequest,
  adyen.paymentsDetails,
);

/**
 *  Save shipping address to currentBasket and
 *  get applicable shipping methods from an Express component in the SFCC session
 */
server.post(
  'ShippingMethods',
  server.middleware.https,
  csrf.validateRequest,
  adyen.callGetShippingMethods,
);

/**
 *  Save selected shipping method to currentBasket from an Express component in the SFCC session
 */
server.post(
  'SelectShippingMethod',
  server.middleware.https,
  csrf.validateRequest,
  adyen.callSelectShippingMethod,
);

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
server.post(
  'Donate',
  server.middleware.https,
  csrf.validateRequest,
  adyenGiving.donation,
);

/**
 * Make a payment from inside a component (paypal)
 */
server.post(
  'PaymentFromComponent',
  server.middleware.https,
  csrf.validateRequest,
  adyen.validatePaymentDataFromRequest,
  adyen.paymentFromComponent,
);

/**
 *  Save shopper details that came from an Express component in the SFCC session
 */
server.post(
  'SaveExpressShopperDetails',
  server.middleware.https,
  csrf.validateRequest,
  adyen.saveExpressShopperDetails,
);

server.post(
  'GetPaymentMethods',
  server.middleware.https,
  csrf.validateRequest,
  adyen.getCheckoutPaymentMethods,
);

/**
 * csrf.generateToken is used since SFRA5 doens't have a token in PDP
 */
server.post(
  'GetExpressPaymentMethods',
  server.middleware.https,
  csrf.generateToken,
  adyen.getCheckoutExpressPaymentMethods,
);

server.post(
  'GetConnectedTerminals',
  server.middleware.https,
  adyen.getConnectedTerminals,
);

/**
 * Show the review page template.
 */
server.get(
  'CheckoutReview',
  server.middleware.https,
  csrf.generateToken,
  adyen.handleCheckoutReview,
);

/**
 * Save paypal express payment data for review page.
 */
server.post(
  'SaveExpressPaymentData',
  server.middleware.https,
  csrf.validateRequest,
  adyen.validatePaymentDataFromRequest,
  adyen.saveExpressPaymentData,
);

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */
server.post('Notify', server.middleware.https, adyen.notify);

/**
 * Called by Adyen to check balance of gift card.
 */
server.post(
  'CheckBalance',
  server.middleware.https,
  csrf.validateRequest,
  adyen.checkBalance,
);

/**
 * Called by Adyen to cancel a partial payment order.
 */
server.post(
  'CancelPartialPaymentOrder',
  server.middleware.https,
  csrf.validateRequest,
  adyen.cancelPartialPaymentOrder,
);

/**
 * Called by Adyen to create a partial payments order
 */
server.post(
  'PartialPaymentsOrder',
  server.middleware.https,
  csrf.validateRequest,
  adyen.partialPaymentsOrder,
);

/**
 * Called by Adyen to apply a giftcard
 */
server.post(
  'partialPayment',
  server.middleware.https,
  csrf.validateRequest,
  adyen.partialPayment,
);

/**
 * Called by Adyen to make /payments call for PayPal Express flow
 */
server.post(
  'MakeExpressPaymentsCall',
  server.middleware.https,
  csrf.validateRequest,
  adyen.validatePaymentDataFromRequest,
  adyen.makeExpressPaymentsCall,
);

/**
 * Called by Adyen to make /paymentsDetails for PayPal Express flow
 */
server.post(
  'MakeExpressPaymentDetailsCall',
  server.middleware.https,
  csrf.validateRequest,
  adyen.makeExpressPaymentDetailsCall,
);

/**
 * Called by Adyen to save the shopper data coming from PayPal Express
 */
server.post(
  'SaveShopperData',
  server.middleware.https,
  csrf.validateRequest,
  adyen.validatePaymentDataFromRequest,
  adyen.saveShopperData,
);
/**
 * Called by Adyen to fetch applied giftcards
 */
server.post(
  'fetchGiftCards',
  server.middleware.https,
  csrf.validateRequest,
  adyen.fetchGiftCards,
);

/**
 * Called by Adyen to create temporary basket for express payment on pdp.
 */
server.post(
  'CreateTemporaryBasket',
  server.middleware.https,
  csrf.validateRequest,
  adyen.createTemporaryBasket,
);

function getExternalPlatformVersion() {
  return EXTERNAL_PLATFORM_VERSION;
}

module.exports = server.exports();

module.exports.getExternalPlatformVersion = getExternalPlatformVersion();
