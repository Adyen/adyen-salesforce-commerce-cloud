const server = require('server');
const consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
const adyenGiving = require('*/cartridge/scripts/adyenGiving');
const { adyen } = require('*/cartridge/controllers/middlewares/index');
const Logger = require('dw/system/Logger');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
const URLUtils = require('dw/web/URLUtils');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

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

server.get(
  'ShippingMethods',
  server.middleware.https,
  adyen.callGetShippingMethods,
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
 *  Save shopper details that came from an Express component in the SFCC session
 */
server.post(
  'SaveExpressShopperDetails',
  server.middleware.https,
//  adyen.saveExpressShopperDetails
  function (req, res, next) {
      try {
       session.privacy.expressShopperDetails = req.form.shopperDetails;
       Logger.getLogger('Adyen').error(' session.privacy.expressShopperDetails ' + JSON.stringify(session.privacy.expressShopperDetails));
       res.json({success: true});
        return next();
      } catch (e) {
        Logger.getLogger('Adyen').error(`Could not save express method shopper details`);
        Logger.getLogger('Adyen').error(JSON.stringify(e));
        res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
        return next();
      }
  }
);

server.get('GetPaymentMethods', server.middleware.https, function (req, res, next) {
       Logger.getLogger('Adyen').error(' inside  GetPaymentMethods');
    var BasketMgr = require('dw/order/BasketMgr');
    var Resource = require('dw/web/Resource');
    var getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');
    var Locale = require('dw/util/Locale');
    var countryCode = Locale.getLocale(req.locale.id).country;
    var currentBasket = BasketMgr.getCurrentBasket();
    if (currentBasket.getShipments().length > 0 && currentBasket.getShipments()[0].shippingAddress) {
        countryCode = currentBasket.getShipments()[0].shippingAddress.getCountryCode();
    }
    var paymentMethods;
    var descriptions = [];
    try {
        paymentMethods = getPaymentMethods.getMethods(BasketMgr.getCurrentBasket(), countryCode.value?.toString() || countryCode.value ).paymentMethods;
        descriptions = paymentMethods.map(function (method) {
            return {
                brandCode: method.type,
                description: Resource.msg('hpp.description.' + method.type, 'hpp', "")
            };
        })
    } catch (err) {
              Logger.getLogger('Adyen').error(' inside  catch ' + JSON.stringify(err));
        paymentMethods = [];
    }

    var adyenURL = AdyenHelper.getLoadingContext() + "images/logos/medium/";

    res.json({
        AdyenPaymentMethods: paymentMethods,
        ImagePath: adyenURL,
        AdyenDescriptions: descriptions
    });
    return next();
});

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
 * Called by Adyen to fetch applied giftcards
 */
server.get('fetchGiftCards', server.middleware.https, adyen.fetchGiftCards);

function getExternalPlatformVersion() {
  return EXTERNAL_PLATFORM_VERSION;
}

module.exports = server.exports();

module.exports.getExternalPlatformVersion = getExternalPlatformVersion();
