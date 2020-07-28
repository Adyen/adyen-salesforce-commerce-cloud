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
  (req, res, next) => {
    try {
      const stateData = JSON.parse(req.form.additionalDetailsHidden);
      const order = OrderMgr.getOrder(session.privacy.orderNo);
      const paymentInstruments = order.getPaymentInstruments(
        constants.METHOD_ADYEN_COMPONENT,
      );
      let adyenPaymentInstrument;

      const { paymentData } = stateData;
      const { details } = stateData;

      // looping through all Adyen payment methods, however, this only can be one.
      const instrumentsIter = paymentInstruments.iterator();
      while (instrumentsIter.hasNext()) {
        adyenPaymentInstrument = instrumentsIter.next();
      }

      // redirect to payment/details
      const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
      const requestObject = {
        details,
        paymentData,
      };

      const result = adyenCheckout.doPaymentDetailsCall(requestObject);
      Transaction.wrap(() => {
        adyenPaymentInstrument.custom.adyenPaymentData = null;
      });
      // Authorised: The payment authorisation was successfully completed.
      if (
        result.resultCode === 'Authorised' ||
        result.resultCode === 'Pending' ||
        result.resultCode === 'Received'
      ) {
        // custom fraudDetection
        const fraudDetectionStatus = { status: 'success' };

        // Places the order
        const placeOrderResult = COHelpers.placeOrder(
          order,
          fraudDetectionStatus,
        );
        if (placeOrderResult.error) {
          Transaction.wrap(() => {
            OrderMgr.failOrder(order, true);
          });
          res.redirect(
            URLUtils.url(
              'Checkout-Begin',
              'stage',
              'placeOrder',
              'paymentError',
              Resource.msg('error.payment.not.valid', 'checkout', null),
            ),
          );
          return next();
        }

        const OrderModel = require('*/cartridge/models/order');
        const Locale = require('dw/util/Locale');
        const currentLocale = Locale.getLocale(req.locale.id);
        const orderModel = new OrderModel(order, {
          countryCode: currentLocale.country,
        });

        // Save orderModel to custom object during session
        Transaction.wrap(() => {
          order.custom.Adyen_CustomerEmail = JSON.stringify(orderModel);
          AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
        });

        clearForms();
        res.redirect(
          URLUtils.https(
            'Order-Confirm',
            'ID',
            order.orderNo,
            'token',
            order.orderToken,
          ).toString(),
        );
        return next();
      }
      Transaction.wrap(() => {
        OrderMgr.failOrder(order, true);
      });
      res.redirect(
        URLUtils.url(
          'Checkout-Begin',
          'stage',
          'placeOrder',
          'paymentError',
          Resource.msg('error.payment.not.valid', 'checkout', null),
        ),
      );
      return next();
    } catch (e) {
      Logger.getLogger('Adyen').error(
        `Could not verify /payment/details: ${e.message}`,
      );
      res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
      return next();
    }
  },
);

/**
 * Make a request to Adyen to get payment methods based on countryCode
 */
server.get('GetPaymentMethods', server.middleware.https, (req, res, next) => {
  const BasketMgr = require('dw/order/BasketMgr');
  const Resource = require('dw/web/Resource');
  const getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');
  const adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');
  const PaymentMgr = require('dw/order/PaymentMgr');
  const Locale = require('dw/util/Locale');

  let countryCode = Locale.getLocale(req.locale.id).country;
  const currentBasket = BasketMgr.getCurrentBasket();
  if (
    currentBasket.getShipments().length > 0 &&
    currentBasket.getShipments()[0].shippingAddress
  ) {
    countryCode = currentBasket
      .getShipments()[0]
      .shippingAddress.getCountryCode().value;
  }
  let response;
  let paymentMethodDescriptions = [];
  let customer;
  try {
    if (req.currentCustomer.profile) {
      customer = CustomerMgr.getCustomerByCustomerNumber(
        req.currentCustomer.profile.customerNo,
      );
    }
    response = getPaymentMethods.getMethods(
      BasketMgr.getCurrentBasket(),
      customer || null,
      countryCode,
    );
    paymentMethodDescriptions = response.paymentMethods.map((method) => ({
      brandCode: method.type,
      description: Resource.msg(`hpp.description.${method.type}`, 'hpp', ''),
    }));
  } catch (err) {
    Logger.getLogger('Adyen').error(
      `Error retrieving Payment Methods. Error message: ${
        err.message
      } more details: ${err.toString()} in ${err.fileName}:${err.lineNumber}`,
    );
    response = [];
    return next();
  }

  let connectedTerminals = {};
  if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive()) {
    connectedTerminals = adyenTerminalApi.getTerminals().response;
  }

  const adyenURL = `${AdyenHelper.getLoadingContext()}images/logos/medium/`;
  const jsonResponse = {
    AdyenPaymentMethods: response,
    ImagePath: adyenURL,
    AdyenDescriptions: paymentMethodDescriptions,
    AdyenConnectedTerminals: JSON.parse(connectedTerminals),
  };
  if (AdyenHelper.getCreditCardInstallments()) {
    const paymentAmount = currentBasket.getTotalGrossPrice()
      ? AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice())
      : 1000;
    const currency = currentBasket.getTotalGrossPrice().currencyCode;
    jsonResponse.amount = { value: paymentAmount, currency };
    jsonResponse.countryCode = countryCode;
  }

  res.json(jsonResponse);
  return next();
});

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
