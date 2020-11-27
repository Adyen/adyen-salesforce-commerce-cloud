const server = require('server');
const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const CustomerMgr = require('dw/customer/CustomerMgr');
const Resource = require('dw/web/Resource');
const Logger = require('dw/system/Logger');
const PaymentMgr = require('dw/order/PaymentMgr');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const constants = require('*/cartridge/adyenConstants/constants');
const collections = require('*/cartridge/scripts/util/collections');
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
  function (req, res, next) {
    const IssuerURL = req.querystring.IssuerURL;
    const PaRequest = req.querystring.PaRequest;
    const orderNo = req.querystring.merchantReference;
    const orderToken = req.querystring.orderToken;
    const MD = req.querystring.MD;
    const TermURL = URLUtils.https(
      'Adyen-AuthorizeWithForm',
      'merchantReference',
      orderNo,
      'orderToken',
      orderToken,
    );
    const signature = req.querystring.signature;

    const currentSignature = AdyenHelper.getAdyenHash(
      IssuerURL.substr(IssuerURL.length - 25),
      MD.substr(1, 25),
    );

    if (signature === currentSignature) {
      res.render('adyenform', {
        issuerUrl: IssuerURL,
        paRequest: PaRequest,
        md: MD,
        ContinueURL: TermURL,
      });
      return next();
    }
    Logger.getLogger('Adyen').error('Signature incorrect for 3DS payment');
    res.redirect(URLUtils.url('Home-Show', 'Payment', 'Failed3DS'));
    return next();
  },
);

/**
 * Make /payments/details call to 3d verification system to complete authorization
 */
server.post(
  'AuthorizeWithForm',
  csrfProtection.generateToken,
  server.middleware.https,
  function (req, res, next) {
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const orderNo = req.querystring.merchantReference;
    const orderToken = req.querystring.orderToken;
    let order = OrderMgr.getOrder(orderNo, orderToken);

    const paymentInstrument = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
    )[0];

    try {
      clearCustomSessionFields();
      if (paymentInstrument.custom.adyenMD !== req.form.MD) {
        clearAdyenData(paymentInstrument);
        Logger.getLogger('Adyen').error(`Incorrect MD for order ${orderNo}`);
        return response.redirect(URLUtils.httpHome());
      }

      const jsonRequest = {
        paymentData: paymentInstrument.custom.adyenPaymentData,
        details: {
          MD: req.form.MD,
          PaRes: req.form.PaRes,
        },
      };
      const result = adyenCheckout.doPaymentDetailsCall(jsonRequest);
      if (result.invalidRequest) {
        Logger.getLogger('Adyen').error(`Invalid request for order ${orderNo}`);
        return response.redirect(URLUtils.httpHome());
      }

      // if error, return to checkout page
      if (result.error || result.resultCode !== 'Authorised') {
        Transaction.wrap(function () {
          OrderMgr.failOrder(order, true);
        });
        res.redirect(
          URLUtils.url(
            'Checkout-Begin',
            'stage',
            'payment',
            'paymentError',
            Resource.msg('error.payment.not.valid', 'checkout', null),
          ),
        );
        return next();
      }

      // custom fraudDetection
      const fraudDetectionStatus = { status: 'success' };

      order = OrderMgr.getOrder(result.merchantReference, orderToken);

      // Places the order
      const placeOrderResult = COHelpers.placeOrder(
        order,
        fraudDetectionStatus,
      );
      if (placeOrderResult.error) {
        Transaction.wrap(function () {
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

      Transaction.begin();
      AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
      order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
      order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
      Transaction.commit();
      COHelpers.sendConfirmationEmail(order, req.locale.id);
      clearAdyenData(paymentInstrument);
      clearForms();
      res.redirect(
        URLUtils.url(
          'Order-Confirm',
          'ID',
          order.orderNo,
          'token',
          order.orderToken,
        ).toString(),
      );
      return next();
    } catch (e) {
      Logger.getLogger('Adyen').error(
        `Could not verify authorizeWithForm: ${
          e.message
        } more details: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
      );
    }
  },
);

/**
 * Complete a 3DS2 payment
 */
server.get(
  'Adyen3DS2',
  consentTracking.consent,
  csrfProtection.generateToken,
  server.middleware.https,
  function (req, res, next) {
    const protocol = req.https ? 'https' : 'http';
    const adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');

    try {
      const originKey = adyenGetOriginKey.getOriginKeyFromRequest(
        protocol,
        req.host,
      );
      const environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
      const resultCode = req.querystring.resultCode;
      const orderNo = req.querystring.merchantReference;
      const orderToken = req.querystring.orderToken;

      const order = OrderMgr.getOrder(orderNo, orderToken);
      const paymentInstrument = order.getPaymentInstruments(
        constants.METHOD_ADYEN_COMPONENT,
      )[0];

      const action = paymentInstrument.custom.adyenAction;
      Transaction.wrap(function () {
        paymentInstrument.custom.adyenAction = null;
      });

      res.render('/threeds2/adyen3ds2', {
        locale: request.getLocale(),
        originKey: originKey,
        environment: environment,
        resultCode: resultCode,
        action,
        merchantReference: orderNo,
        orderToken: orderToken,
      });
    } catch (err) {
      Logger.getLogger('Adyen').error(
        `3DS2 redirect failed with reason: ${err.toString()}`,
      );
      res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    }

    return next();
  },
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
  function (req, res, next) {
    try {
      Transaction.begin();
      const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
      const orderNo = req.form.merchantReference;
      const orderToken = req.form.orderToken;
      const order = OrderMgr.getOrder(orderNo, orderToken);
      const paymentInstrument = order.getPaymentInstruments(
        constants.METHOD_ADYEN_COMPONENT,
      )[0];
      let details = {};
      if (
        ['IdentifyShopper', 'ChallengeShopper'].indexOf(req.form.resultCode) !== -1
          || req.form.challengeResult
      ) {
        details = JSON.parse(req.form.stateData).details;
      } else {
        Logger.getLogger('Adyen').error('paymentDetails 3DS2 not available');
        res.redirect(
          URLUtils.url(
            'Checkout-Begin',
            'stage',
            'payment',
            'paymentError',
            Resource.msg('error.payment.not.valid', 'checkout', null),
          ),
        );
        return next();
      }

      const paymentDetailsRequest = {
        paymentData: paymentInstrument.custom.adyenPaymentData,
        details: details,
      };

      const result = adyenCheckout.doPaymentDetailsCall(paymentDetailsRequest);
      if (result.invalidRequest) {
        Logger.getLogger('Adyen').error(`Invalid request for order ${orderNo}`);
        clearAdyenData(paymentInstrument);
        return response.redirect(URLUtils.httpHome());
      }
      const resultOrderNo = result.merchantReference || orderNo;
      const resultOrder = OrderMgr.getOrder(resultOrderNo, orderToken);

      if (!result.action && (result.error || result.resultCode !== 'Authorised')) {
        // Payment failed
        Transaction.wrap(function () {
          OrderMgr.failOrder(resultOrder, true);
          paymentInstrument.custom.adyenPaymentData = null;
        });
        res.redirect(
          URLUtils.url(
            'Checkout-Begin',
            'stage',
            'payment',
            'paymentError',
            Resource.msg('error.payment.not.valid', 'checkout', null),
          ),
        );
        return next();
      }
      if (result.action) {
        // Redirect to ChallengeShopper
        Transaction.wrap(function () {
          paymentInstrument.custom.adyenAction = JSON.stringify(result.action);
        });

        res.redirect(
          URLUtils.url(
            'Adyen-Adyen3DS2',
            'merchantReference',
            resultOrderNo,
            'orderToken',
            orderToken,
          ),
        );
        return next();
      }

      // delete paymentData from requests
      Transaction.wrap(function () {
        paymentInstrument.custom.adyenPaymentData = null;
      });

      // custom fraudDetection
      const fraudDetectionStatus = { status: 'success' };

      // Places the order
      const placeOrderResult = COHelpers.placeOrder(
        resultOrder,
        fraudDetectionStatus,
      );
      if (placeOrderResult.error) {
        Transaction.wrap(function () {
          OrderMgr.failOrder(resultOrder, true);
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

      Transaction.begin();
      AdyenHelper.savePaymentDetails(paymentInstrument, resultOrder, result);
      resultOrder.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
      resultOrder.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
      Transaction.commit();
      COHelpers.sendConfirmationEmail(resultOrder, req.locale.id);
      clearForms();
      res.redirect(
        URLUtils.url(
          'Order-Confirm',
          'ID',
          resultOrder.orderNo,
          'token',
          resultOrder.orderToken,
        ).toString(),
      );
      return next();
    } catch (e) {
      Logger.getLogger('Adyen').error(
        `Could not complete authorize3ds2: ${
          e.message
        } more details: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
      );
    }
  },
);

/**
 * Redirect to Adyen after saving order etc.
 */
server.get('Redirect', server.middleware.https, function (req, res, next) {
  const signature = req.querystring.signature;
  const orderNo = req.querystring.merchantReference;
  const orderToken = req.querystring.orderToken;

  const order = OrderMgr.getOrder(orderNo, orderToken);
  if (order && signature) {
    const paymentInstruments = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
    );
    let adyenPaymentInstrument;
    let paymentData;

    // looping through all Adyen payment methods, however, this only can be one.
    const instrumentsIter = paymentInstruments.iterator();
    while (instrumentsIter.hasNext()) {
      adyenPaymentInstrument = instrumentsIter.next();
      paymentData = adyenPaymentInstrument.custom.adyenPaymentData;
    }
    const currentSignature = AdyenHelper.getAdyenHash(
      req.querystring.redirectUrl.substr(
        req.querystring.redirectUrl.length - 25,
      ),
      paymentData.substr(1, 25),
    );

    if (signature === currentSignature) {
      res.redirect(req.querystring.redirectUrl);
      return next();
    }
  } else {
    Logger.getLogger('Adyen').error(
      `no order with orderNo ${orderNo}`,
    );
  }

  Logger.getLogger('Adyen').error('Redirect signature is not correct');
  Transaction.wrap(function () {
    OrderMgr.failOrder(order, true);
  });
  res.redirect(
    URLUtils.url(
      'Checkout-Begin',
      'stage',
      'payment',
      'paymentError',
      Resource.msg('error.payment.not.valid', 'checkout', null),
    ),
  );
  return next();
});

/**
 * Show confirmation after return from Adyen
 */
server.get('ShowConfirmation', server.middleware.https, function (
  req,
  res,
  next,
) {
  try {
    const orderToken = req.querystring.orderToken;
    const order = OrderMgr.getOrder(req.querystring.merchantReference, orderToken);
    const paymentInstruments = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
    );
    let adyenPaymentInstrument;
    let paymentData;
    let details;

    // looping through all Adyen payment methods, however, this only can be one.
    const instrumentsIter = paymentInstruments.iterator();
    while (instrumentsIter.hasNext()) {
      adyenPaymentInstrument = instrumentsIter.next();
      paymentData = adyenPaymentInstrument.custom.adyenPaymentData;
    }

    // details is either redirectResult or payload
    if (req.querystring.redirectResult) {
      details = { redirectResult: req.querystring.redirectResult };
    } else if (req.querystring.payload) {
      details = { payload: req.querystring.payload };
    }

    // redirect to payment/details
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const requestObject = {
      details: details,
      paymentData: paymentData,
    };

    const result = adyenCheckout.doPaymentDetailsCall(requestObject);
    clearAdyenData(adyenPaymentInstrument);
    if (result.invalidRequest) {
      Logger.getLogger('Adyen').error('Invalid /payments/details call');
      return response.redirect(URLUtils.httpHome());
    }
    const merchantRefOrder = OrderMgr.getOrder(result.merchantReference, orderToken);

    const paymentInstrument = merchantRefOrder.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
    )[0];

    // Authorised: The payment authorisation was successfully completed.
    if (
      result.resultCode === 'Authorised'
      || result.resultCode === 'Pending'
      || result.resultCode === 'Received'
    ) {
      if (
        result.resultCode === 'Received'
        && result.paymentMethod.indexOf('alipay_hk') > -1
      ) {
        Transaction.wrap(function () {
          OrderMgr.failOrder(merchantRefOrder, true);
        });
        Logger.getLogger('Adyen').error(
          `Did not complete Alipay transaction, result: ${
            JSON.stringify(result)}`,
        );
        res.redirect(
          URLUtils.url(
            'Checkout-Begin',
            'stage',
            'payment',
            'paymentError',
            Resource.msg('error.payment.not.valid', 'checkout', null),
          ),
        );
        return next();
      }

      // custom fraudDetection
      const fraudDetectionStatus = { status: 'success' };

      // Places the order
      const placeOrderResult = COHelpers.placeOrder(
        order,
        fraudDetectionStatus,
      );
      if (placeOrderResult.error) {
        Transaction.wrap(function () {
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
      const orderModel = new OrderModel(merchantRefOrder, {
        countryCode: currentLocale.country,
      });

      // Save orderModel to custom object during session
      Transaction.wrap(function () {
        order.custom.Adyen_CustomerEmail = JSON.stringify(orderModel);
        AdyenHelper.savePaymentDetails(paymentInstrument, merchantRefOrder, result);
      });

      clearForms();
      res.redirect(
        URLUtils.url(
          'Order-Confirm',
          'ID',
          order.orderNo,
          'token',
          order.orderToken,
        ).toString(),
      );
      return next();
    }
    Transaction.wrap(function () {
      OrderMgr.failOrder(merchantRefOrder, true);
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
});

/**
 * Show confirmation for payments completed from component directly e.g. paypal, QRcode, ..
 */
server.post(
  'ShowConfirmationPaymentFromComponent',
  server.middleware.https,
  function (req, res, next) {
    try {
      const stateData = JSON.parse(req.form.additionalDetailsHidden);
      const orderToken = req.form.orderToken;
      const order = OrderMgr.getOrder(req.form.merchantReference, orderToken);
      const paymentInstruments = order.getPaymentInstruments(
        constants.METHOD_ADYEN_COMPONENT,
      );

      let adyenPaymentInstrument;
      // looping through all Adyen payment methods, however, this only can be one.
      const instrumentsIter = paymentInstruments.iterator();
      while (instrumentsIter.hasNext()) {
        adyenPaymentInstrument = instrumentsIter.next();
      }

      // This is state data from the component
      const hasStateData = stateData && stateData.paymentData && stateData.details;
      if (!hasStateData) {
        Transaction.wrap(function () {
          OrderMgr.failOrder(order, true);
          adyenPaymentInstrument.custom.adyenPaymentData = null;
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
      const paymentData = stateData.paymentData;
      const details = stateData.details;

      // redirect to payment/details
      const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
      const requestObject = {
        details: details,
        paymentData: paymentData,
      };

      const result = adyenCheckout.doPaymentDetailsCall(requestObject);
      Transaction.wrap(function () {
        adyenPaymentInstrument.custom.adyenPaymentData = null;
      });
      // Authorised: The payment authorisation was successfully completed.
      if (
        result.resultCode === 'Authorised'
        || result.resultCode === 'Pending'
        || result.resultCode === 'Received'
      ) {
        // custom fraudDetection
        const fraudDetectionStatus = { status: 'success' };

        // Places the order
        const placeOrderResult = COHelpers.placeOrder(
          order,
          fraudDetectionStatus,
        );
        if (placeOrderResult.error) {
          Transaction.wrap(function () {
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
        Transaction.wrap(function () {
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
      Transaction.wrap(function () {
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
        `Could not verify /payment/details: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
      );
      res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
      return next();
    }
  },
);

/**
 * Make a request to Adyen to get payment methods based on countryCode
 */
server.get('GetPaymentMethods', server.middleware.https, function (
  req,
  res,
  next,
) {
  const BasketMgr = require('dw/order/BasketMgr');
  const Resource = require('dw/web/Resource');
  const getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');
  const adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');
  const PaymentMgr = require('dw/order/PaymentMgr');
  const Locale = require('dw/util/Locale');

  let countryCode = Locale.getLocale(req.locale.id).country;
  const currentBasket = BasketMgr.getCurrentBasket();
  if (
    currentBasket.getShipments().length > 0
    && currentBasket.getShipments()[0].shippingAddress
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
    paymentMethodDescriptions = response.paymentMethods.map(function (method) {
      return {
        brandCode: method.type,
        description: Resource.msg(`hpp.description.${method.type}`, 'hpp', ''),
      };
    });
  } catch (err) {
    Logger.getLogger('Adyen').error(
      `Error retrieving Payment Methods. Error message: ${
        err.message
      } more details: ${
        err.toString()
      } in ${
        err.fileName
      }:${
        err.lineNumber}`,
    );
    response = [];
    return next();
  }

  let connectedTerminals = {};
  if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive()) {
    connectedTerminals = adyenTerminalApi.getTerminals().response;
  }

  const adyenURL = `${AdyenHelper.getLoadingContext()}images/logos/medium/`;
  const paymentAmount = currentBasket.getTotalGrossPrice()
    ? AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()).getValueOrNull()
    : 1000;
  const currency = currentBasket.getTotalGrossPrice().currencyCode;
  const jsonResponse = {
    AdyenPaymentMethods: response,
    ImagePath: adyenURL,
    AdyenDescriptions: paymentMethodDescriptions,
    AdyenConnectedTerminals: JSON.parse(connectedTerminals),
    amount: { value: paymentAmount, currency: currency },
    countryCode: countryCode,
  };

  res.json(jsonResponse);
  return next();
});

/**
 * Complete a donation through adyenGiving
 */
server.post('Donate', server.middleware.https, function (req /* , res, next */) {
  const adyenGiving = require('*/cartridge/scripts/adyenGiving');
  const pspReference = req.form.pspReference;
  const orderNo = req.form.orderNo;
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
server.post('PaymentFromComponent', server.middleware.https, function (
  req,
  res,
  next,
) {
  const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
  const BasketMgr = require('dw/order/BasketMgr');
  const reqDataObj = JSON.parse(req.form.data);
  if (reqDataObj.cancelTransaction) {
    Logger.getLogger('Adyen').error(
      'Shopper cancelled transaction',
    );
    return {};
  }
  const currentBasket = BasketMgr.getCurrentBasket();

  let paymentInstrument;
  Transaction.wrap(function () {
    collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
      currentBasket.removePaymentInstrument(item);
    });
    paymentInstrument = currentBasket.createPaymentInstrument(
      constants.METHOD_ADYEN_COMPONENT,
      currentBasket.totalGrossPrice,
    );
    const paymentProcessor = PaymentMgr.getPaymentMethod(
      paymentInstrument.paymentMethod,
    ).paymentProcessor;
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    paymentInstrument.custom.adyenPaymentData = req.form.data;
    paymentInstrument.custom.adyenPaymentMethod = req.form.paymentMethod;
  });
  const order = COHelpers.createOrder(currentBasket);

  const result = adyenCheckout.createPaymentRequest({
    Order: order,
    PaymentInstrument: paymentInstrument,
  });

  result.orderNo = order.orderNo;
  result.orderToken = order.getOrderToken();
  res.json(result);
  return next();
});

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */
server.post('Notify', server.middleware.https, function (req, res, next) {
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

/**
 * Clear system session data
 */
function clearForms() {
  // Clears all forms used in the checkout process.
  session.forms.billing.clearFormElement();
  clearCustomSessionFields();
}

function clearAdyenData(paymentInstrument) {
  Transaction.wrap(() => {
    paymentInstrument.custom.adyenPaymentData = null;
    paymentInstrument.custom.adyenMD = null;
  });
}

/**
 * Clear custom session data
 */
function clearCustomSessionFields() {
  // Clears all fields used in the 3d secure payment.
  session.privacy.paymentMethod = null;
  session.privacy.orderNo = null;
  session.privacy.brandCode = null;
  session.privacy.issuer = null;
  session.privacy.adyenPaymentMethod = null;
  session.privacy.adyenIssuerName = null;
  session.privacy.ratePayFingerprint = null;
}

function getExternalPlatformVersion() {
  return EXTERNAL_PLATFORM_VERSION;
}

module.exports = server.exports();

module.exports.getExternalPlatformVersion = getExternalPlatformVersion();
