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
  (req, res, next) => {
    let order;
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const BasketMgr = require('dw/order/BasketMgr');
    const reqDataObj = JSON.parse(req.form.data);

    if (reqDataObj.cancelTransaction) {
      order = OrderMgr.getOrder(session.privacy.orderNo);
      Logger.getLogger('Adyen').error(
        `Shopper cancelled transaction for order ${session.privacy.orderNo}`,
      );
      Transaction.wrap(() => {
        OrderMgr.failOrder(order, true);
      });
      res.json({ result: 'cancelled' });
      return next();
    }
    const currentBasket = BasketMgr.getCurrentBasket();

    let paymentInstrument;
    Transaction.wrap(() => {
      collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
        currentBasket.removePaymentInstrument(item);
      });
      paymentInstrument = currentBasket.createPaymentInstrument(
        constants.METHOD_ADYEN_COMPONENT,
        currentBasket.totalGrossPrice,
      );
      const { paymentProcessor } = PaymentMgr.getPaymentMethod(
        paymentInstrument.paymentMethod,
      );
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
      paymentInstrument.custom.adyenPaymentData = req.form.data;
      paymentInstrument.custom.adyenPaymentMethod =
        reqDataObj.paymentMethod.type;
    });
    order = COHelpers.createOrder(currentBasket);
    session.privacy.orderNo = order.orderNo;

    const result = adyenCheckout.createPaymentRequest({
      Order: order,
      PaymentInstrument: paymentInstrument,
    });

    if (result.resultCode !== 'Pending') {
      Transaction.wrap(() => {
        OrderMgr.failOrder(order, true);
      });
    }
    res.json(result);
    return next();
  },
);

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */
server.post('Notify', server.middleware.https, (req, res, next) => {
  const checkAuth = require('*/cartridge/scripts/checkNotificationAuth');
  const status = checkAuth.check(req);
  if (!status) {
    res.render('/adyen/error');
    return {};
  }
  const handleNotify = require('*/cartridge/scripts/handleNotify');
  Transaction.begin();
  const notificationResult = handleNotify.notify(req.form);

  if (notificationResult.success) {
    Transaction.commit();
    res.render('/notify');
  } else {
    res.render('/notifyError', {
      errorMessage: notificationResult.errorMessage,
    });
    Transaction.rollback();
  }
  next();
});

function getExternalPlatformVersion() {
  return EXTERNAL_PLATFORM_VERSION;
}

module.exports = server.exports();

module.exports.getExternalPlatformVersion = getExternalPlatformVersion();
