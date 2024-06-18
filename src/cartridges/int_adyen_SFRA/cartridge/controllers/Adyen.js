const server = require('server');
const consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
const adyenGiving = require('*/cartridge/adyen/scripts/donations/adyenGiving');
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

/**
 *  Save shipping address to currentBasket and
 *  get applicable shipping methods from an Express component in the SFCC session
 */
server.post(
  'ShippingMethods',
  server.middleware.https,
  adyen.callGetShippingMethods,
);

/**
 *  Save selected shipping method to currentBasket from an Express component in the SFCC session
 */
server.post(
  'SelectShippingMethod',
  server.middleware.https,
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
server.post('Donate', server.middleware.https, (req /* , res, next */) => {
  const { orderNo, orderToken } = req.form;
  const donationAmount = {
    value: req.form.amountValue,
    currency: req.form.amountCurrency,
  };
  const donationResult = adyenGiving.donate(
    orderNo,
    donationAmount,
    orderToken,
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
 *  Save shopper details that came from an Express component in the SFCC session
 */
server.post(
  'SaveExpressShopperDetails',
  server.middleware.https,
  adyen.saveExpressShopperDetails,
);

server.get(
  'GetPaymentMethods',
  server.middleware.https,
  adyen.getCheckoutPaymentMethods,
);

/**
 * Show the review page template.
 */
server.get(
  'CheckoutReview',
  server.middleware.https,
  adyen.handleCheckoutReview,
);

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
server.post(
  'CancelPartialPaymentOrder',
  server.middleware.https,
  adyen.cancelPartialPaymentOrder,
);

/**
 * Called by Adyen to create a partial payments order
 */
server.post(
  'PartialPaymentsOrder',
  server.middleware.https,
  adyen.partialPaymentsOrder,
);

/**
 * Called by Adyen to apply a giftcard
 */
server.post('partialPayment', server.middleware.https, adyen.partialPayment);

/**
 * Called by Adyen to make /payments call for PayPal Express flow
 */
server.post(
  'MakeExpressPaymentsCall',
  server.middleware.https,
  adyen.makeExpressPaymentsCall,
);

/**
 * Called by Adyen to make /paymentsDetails for PayPal Express flow
 */
server.post(
  'MakeExpressPaymentDetailsCall',
  server.middleware.https,
  adyen.makeExpressPaymentDetailsCall,
);

/**
 * Called by Adyen to save the shopper data coming from PayPal Express
 */
server.post('SaveShopperData', server.middleware.https, adyen.saveShopperData);
/**
 * Called by Adyen to fetch applied giftcards
 */
server.get('fetchGiftCards', server.middleware.https, adyen.fetchGiftCards);

function getExternalPlatformVersion() {
  return EXTERNAL_PLATFORM_VERSION;
}

module.exports = server.exports();

module.exports.getExternalPlatformVersion = getExternalPlatformVersion();
