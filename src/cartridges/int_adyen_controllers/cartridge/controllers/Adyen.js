const Resource = require('dw/web/Resource');
const URLUtils = require('dw/web/URLUtils');
const OrderMgr = require('dw/order/OrderMgr');
const BasketMgr = require('dw/order/BasketMgr');

const Status = require('dw/system/Status');
const Transaction = require('dw/system/Transaction');
const PaymentMgr = require('dw/order/PaymentMgr');
const CSRFProtection = require('dw/web/CSRFProtection');

/* Script Modules */
const app = require('app_storefront_controllers/cartridge/scripts/app');
const guard = require('app_storefront_controllers/cartridge/scripts/guard');
const Logger = require('dw/system/Logger');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

const OrderModel = app.getModel('Order');
const constants = require('*/cartridge/adyenConstants/constants');

const EXTERNAL_PLATFORM_VERSION = 'SiteGenesis';
/**
 * Controller for all storefront processes.
 *
 * @module controllers/Adyen
 */

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */
function notify() {
  const checkAuth = require('*/cartridge/scripts/checkNotificationAuth');

  const status = checkAuth.check(request);
  if (!status) {
    app.getView().render('adyen/error');
    return {};
  }

  const handleNotify = require('*/cartridge/scripts/handleNotify');

  Transaction.begin();
  const notificationResult = handleNotify.notifyHttpParameterMap(
    request.httpParameterMap,
  );

  if (notificationResult.success) {
    Transaction.commit();
    app.getView().render('notify');
  } else {
    app
      .getView({
        errorMessage: notificationResult.errorMessage,
      })
      .render('/notifyError');
    Transaction.rollback();
  }
}

/**
 * Redirect to Adyen after saving order etc.
 */
function redirect(order, redirectUrl) {
  response.redirect(redirectUrl);
}

/**
 * Show confirmation after return from Adyen
 */
function showConfirmation() {
  try {
    const orderNumber = session.privacy.orderNo;
    const order = OrderMgr.getOrder(orderNumber);
    const paymentInstruments = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
    );
    let adyenPaymentInstrument;
    let paymentData;

    const instrumentsIter = paymentInstruments.iterator();
    while (instrumentsIter.hasNext()) {
      adyenPaymentInstrument = instrumentsIter.next();
      paymentData = adyenPaymentInstrument.custom.adyenPaymentData;
    }

    // redirect to payment/details
    const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    const requestObject = {
      details: getDetails(),
      paymentData: paymentData,
    };
    const result = adyenCheckout.doPaymentDetailsCall(requestObject);
    Transaction.wrap(function () {
      adyenPaymentInstrument.custom.adyenPaymentData = null;
    });
    if (
      ['Authorised', 'Pending', 'Received', 'PresentToShopper'].indexOf(
        result.resultCode,
      ) > -1
    ) {
      if (
        result.resultCode === 'Received'
        && result.paymentMethod.indexOf('alipay_hk') > -1
      ) {
        Transaction.wrap(function () {
          OrderMgr.failOrder(order, true);
        });
        Logger.getLogger('Adyen').error(
          `Did not complete Alipay transaction, result: ${
            JSON.stringify(result)}`,
        );
        const errorStatus = new dw.system.Status(
          dw.system.Status.ERROR,
          'confirm.error.declined',
        );

        app.getController('COSummary').Start({
          PlaceOrderError: errorStatus,
        });
        return {};
      }
      Transaction.wrap(function () {
        AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
      });
      OrderModel.submit(order);
      clearForms();
      return app.getController('COSummary').ShowConfirmation(order);
    }
    // fail order
    Transaction.wrap(function () {
      OrderMgr.failOrder(order, true);
    });
    Logger.getLogger('Adyen').error(
      `Payment failed, result: ${JSON.stringify(result)}`,
    );

    // should be assingned by previous calls or not
    const errorStatus = new dw.system.Status(
      dw.system.Status.ERROR,
      'confirm.error.declined',
    );

    app.getController('COSummary').Start({
      PlaceOrderError: errorStatus,
    });
  } catch (e) {
    Logger.getLogger('Adyen').error(
      `Could not verify showConfirmation: ${
        e.message
      } more details: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
    );
  }

  return {};
}

function getDetails() {
  const { redirectResult, payload } = request.httpParameterMap;
  return {
    ...(redirectResult.value && { redirectResult: redirectResult.value }),
    ...(payload.value && { payload: payload.value }),
  };
}

/**
 * Make a payment from inside a component (used by paypal)
 */
function paymentFromComponent() {
  if (
    request.httpParameterMap
      .getRequestBodyAsString()
      .indexOf('cancelTransaction') > -1
  ) {
    Logger.getLogger('Adyen').error(
      `Shopper cancelled transaction for order ${session.privacy.orderNo}`,
    );
    return;
  }

  const adyenRemovePreviousPI = require('*/cartridge/scripts/adyenRemovePreviousPI');

  const currentBasket = BasketMgr.getCurrentBasket();
  const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
  let paymentInstrument;

  Transaction.wrap(function () {
    const result = adyenRemovePreviousPI.removePaymentInstruments(
      currentBasket,
    );
    if (result.error) {
      return result;
    }
    const stateDataStr = request.httpParameterMap.getRequestBodyAsString();
    paymentInstrument = currentBasket.createPaymentInstrument(
      constants.METHOD_ADYEN_COMPONENT,
      currentBasket.totalGrossPrice,
    );
    const paymentProcessor = PaymentMgr.getPaymentMethod(
      paymentInstrument.paymentMethod,
    ).paymentProcessor;
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    paymentInstrument.custom.adyenPaymentData = stateDataStr;
    session.privacy.paymentMethod = paymentInstrument.paymentMethod;
    try {
      paymentInstrument.custom.adyenPaymentMethod = JSON.parse(
        stateDataStr,
      ).paymentMethod.type;
    } catch (e) {
      // Error parsing paymentMethod
    }
  });
  const order = OrderMgr.createOrder(currentBasket);
  session.privacy.orderNo = order.orderNo;

  Transaction.begin();
  const result = adyenCheckout.createPaymentRequest({
    Order: order,
    PaymentInstrument: paymentInstrument,
  });

  Transaction.commit();
  const responseUtils = require('*/cartridge/scripts/util/Response');
  responseUtils.renderJSON({ result: result });
}

/**
 * Show confirmation for payments completed from component directly e.g. paypal, QRcode, ..
 */
function showConfirmationPaymentFromComponent() {
  const paymentInformation = app.getForm('adyPaydata');
  const orderNumber = session.privacy.orderNo;
  const order = OrderMgr.getOrder(orderNumber);
  const paymentInstruments = order.getPaymentInstruments(
    constants.METHOD_ADYEN_COMPONENT,
  );
  let adyenPaymentInstrument;

  const instrumentsIter = paymentInstruments.iterator();
  while (instrumentsIter.hasNext()) {
    adyenPaymentInstrument = instrumentsIter.next();
  }

  const passedData = JSON.parse(
    paymentInformation.get('paymentFromComponentStateData').value(),
  );
  // This is state data from the component
  const hasStateData = passedData && passedData.details && passedData.paymentData;

  // The billing step is fulfilled, this is necessary for unsuccessful payments
  app.getForm('billing').object.fulfilled.value = true;

  if (!hasStateData) {
    Transaction.wrap(function () {
      OrderMgr.failOrder(order, true);
    });

    const errorStatus = new dw.system.Status(
      dw.system.Status.ERROR,
      'confirm.error.declined',
    );

    app.getController('COSummary').Start({
      PlaceOrderError: errorStatus,
    });
    return {};
  }

  const details = passedData.details;
  const paymentData = passedData.paymentData;

  // redirect to payment/details
  const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
  const requestObject = {
    details: details,
    paymentData: paymentData,
  };
  const result = adyenCheckout.doPaymentDetailsCall(requestObject);
  const paymentProcessor = PaymentMgr.getPaymentMethod(
    adyenPaymentInstrument.getPaymentMethod(),
  ).getPaymentProcessor();

  Transaction.wrap(function () {
    adyenPaymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    adyenPaymentInstrument.custom.adyenPaymentData = null;
  });
  if (result.resultCode === 'Authorised') {
    Transaction.wrap(function () {
      AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
    });
    OrderModel.submit(order);
    clearForms();
    app.getController('COSummary').ShowConfirmation(order);
    return {};
  }

  // fail order
  Transaction.wrap(function () {
    OrderMgr.failOrder(order, true);
  });
  // should be assingned by previous calls or not
  const errorStatus = new dw.system.Status(
    dw.system.Status.ERROR,
    'confirm.error.declined',
  );

  app.getController('COSummary').Start({
    PlaceOrderError: errorStatus,
  });
  return {};
}

/**
 * Complete a donation through adyenGiving
 */
function donate() {
  const adyenGiving = require('*/cartridge/scripts/adyenGiving');
  const responseUtils = require('*/cartridge/scripts/util/Response');
  let req;
  try {
    req = JSON.parse(request.httpParameterMap.getRequestBodyAsString());
  } catch (e) {
    Logger.getLogger('Adyen').error(e);
  }

  const pspReference = req.pspReference;
  const orderNo = req.orderNo;
  const donationAmount = {
    value: req.amountValue,
    currency: req.amountCurrency,
  };
  const donationResult = adyenGiving.donate(
    orderNo,
    donationAmount,
    pspReference,
  );

  responseUtils.renderJSON({ response: donationResult.response });
}

/**
 * Separated order confirm for Credit cards and APM's.
 */
function orderConfirm(orderNo) {
  let order = null;
  if (orderNo) {
    order = OrderMgr.getOrder(orderNo);
  }
  if (!order) {
    app.getController('Error').Start();
    return {};
  }
  app.getController('COSummary').ShowConfirmation(order);
}

/**
 * Make a request to Adyen to get payment methods based on countryCode. Called from COBilling-Start
 */
function getPaymentMethods(cart, customer) {
  const Locale = require('dw/util/Locale');
  let countryCode = Locale.getLocale(request.getLocale()).country;
  const currentBasket = BasketMgr.getCurrentBasket();
  if (
    currentBasket.getShipments().length > 0
    && currentBasket.getShipments()[0].shippingAddress
  ) {
    countryCode = currentBasket
      .getShipments()[0]
      .shippingAddress.getCountryCode()
      .value.toUpperCase();
  }
  const adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');
  const PaymentMgr = require('dw/order/PaymentMgr');
  const getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');
  const response = getPaymentMethods.getMethods(
    cart.object,
    customer,
    countryCode,
  );
  const paymentMethodDescriptions = response.paymentMethods.map(function (
    method,
  ) {
    return {
      brandCode: method.type,
      description: Resource.msg(`hpp.description.${method.type}`, 'hpp', ''),
    };
  });
  const adyenURL = `${AdyenHelper.getLoadingContext()}images/logos/medium/`;

  let connectedTerminals = {};
  if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive()) {
    try {
      const connectedTerminalsResponse = adyenTerminalApi.getTerminals()
        .response;
      if (connectedTerminalsResponse) {
        connectedTerminals = JSON.parse(connectedTerminalsResponse);
      }
    } catch (e) {
      // Error parsing terminal response
    }
  }
  const jsonResponse = {
    adyenPaymentMethods: response,
    adyenConnectedTerminals: connectedTerminals,
    ImagePath: adyenURL,
    AdyenDescriptions: paymentMethodDescriptions,
  };

  if (AdyenHelper.getCreditCardInstallments()) {
    const paymentAmount = currentBasket.getTotalGrossPrice()
      ? AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice())
      : 1000;
    const currency = currentBasket.getTotalGrossPrice().currencyCode;
    jsonResponse.amount = { value: paymentAmount, currency: currency };
    jsonResponse.countryCode = countryCode;
  }

  return jsonResponse;
}

function redirect3ds2() {
  const adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');
  const originKey = adyenGetOriginKey.getOriginKeyFromRequest(
    request.httpProtocol,
    request.httpHost,
  );
  const environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
  const locale = request.getLocale();

  const action = getAction();

  app
    .getView({
      locale: locale,
      originKey: originKey,
      environment: environment,
      resultCode: request.httpParameterMap.get('resultCode').stringValue,
      action,
      ContinueURL: URLUtils.https('Adyen-Authorize3DS2'),
    })
    .render('/threeds2/adyen3ds2');
}

/**
 * Make second call to /payments/details with IdentifyShopper or ChallengeShopper token
 *
 * @returns rendering template or error
 */
function authorize3ds2() {
  if (!CSRFProtection.validateRequest()) {
    Logger.getLogger('Adyen').error(
        `CSRF Mismatch for order ${session.privacy.orderNo}`,
    );
    response.redirect(URLUtils.httpHome());
    return;
  }
  Transaction.begin();
  const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
  let paymentInstrument;
  let order;

  if (session.privacy.orderNo && session.privacy.paymentMethod) {
    try {
      order = OrderMgr.getOrder(session.privacy.orderNo);
      paymentInstrument = order.getPaymentInstruments(
          session.privacy.paymentMethod,
      )[0];
    } catch (e) {
      Logger.getLogger('Adyen').error(
          'Unable to retrieve order data from session 3DS2.',
      );
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
      app.getController('COSummary').Start({
        PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', ''),
      });
      return {};
    }

    let details = {};
    if (
        request.httpParameterMap.get('resultCode').stringValue
        === 'IdentifyShopper' ||
        request.httpParameterMap.get('resultCode').stringValue
        === 'ChallengeShopper' ||
        request.httpParameterMap.get('resultCode').stringValue
        === "challengeResult"
    ) {
      details = JSON.parse(request.httpParameterMap.get(
          'stateData',
      ).stringValue).details;
    } else {
      Logger.getLogger('Adyen').error('paymentDetails 3DS2 not available');
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
      app.getController('COSummary').Start({
        PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', ''),
      });
      return {};
    }

    const paymentDetailsRequest = {
      paymentData: paymentInstrument.custom.adyenPaymentData,
      details: details,
    };
    const result = adyenCheckout.doPaymentDetailsCall(paymentDetailsRequest);
    if(!result.action && (result.error || result.resultCode !== 'Authorised')) {
       // Payment failed
       Transaction.wrap(function () {
         OrderMgr.failOrder(order, true);
         paymentInstrument.custom.adyenPaymentData = null;
       });
       app.getController('COSummary').Start({
         PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', ''),
       });
       return {};
    }
    if(result.action){
      app
        .getView({
          ContinueURL: URLUtils.https(
            'Adyen-Redirect3DS2',
            'utm_nooverride',
            '1',
          ),
          action: JSON.stringify(result.action),
        })
          .render('/threeds2/adyen3ds2');
      return {};
    }

    order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
    order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
    paymentInstrument.custom.adyenPaymentData = null;
    AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
    Transaction.commit();

    OrderModel.submit(order);
    clearForms();
    app.getController('COSummary').ShowConfirmation(order);
    return {};
  }

  Logger.getLogger('Adyen').error('Session variables for 3DS2 do not exist');
  app.getController('COSummary').Start({
    PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', ''),
  });
  return {};
}

/**
 * Make /payments/details call to 3d verification system to complete authorization
 *
 * @returns rendering template or error
 */
function authorizeWithForm() {
  let order;
  let paymentInstrument;
  const MD = request.httpParameterMap.get('MD').stringValue;
  const PaRes = request.httpParameterMap.get('PaRes').stringValue;

  if (session.privacy.orderNo && session.privacy.paymentMethod) {
    try {
      order = OrderMgr.getOrder(session.privacy.orderNo);
      paymentInstrument = order.getPaymentInstruments(
        session.privacy.paymentMethod,
      )[0];
    } catch (e) {
      Logger.getLogger('Adyen').error(
        'Unable to retrieve order data from session.',
      );
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
      app.getController('COSummary').Start({
        PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', ''),
      });
      return {};
    }

    if (session.privacy.MD === MD) {
      // compare the MD from Adyen's payments response with the one from the issuer
      clearCustomSessionFields();
      Transaction.begin();
      const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
      const jsonRequest = {
        paymentData: paymentInstrument.custom.adyenPaymentData,
        details: {
          MD: MD,
          PaRes: PaRes,
        },
      };

      const result = adyenCheckout.doPaymentDetailsCall(jsonRequest);

      if (result.error || result.resultCode !== 'Authorised') {
        Transaction.rollback();
        Transaction.wrap(function () {
          paymentInstrument.custom.adyenPaymentData = null;
          OrderMgr.failOrder(order, true);
        });
        app.getController('COSummary').Start({
          PlaceOrderError: new Status(
            Status.ERROR,
            'confirm.error.declined',
            '',
          ),
        });
        return {};
      }

      order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
      order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
      paymentInstrument.custom.adyenPaymentData = null;
      AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
      Transaction.commit();

      OrderModel.submit(order);
      clearForms();
      app.getController('COSummary').ShowConfirmation(order);
      return {};
    }
    Logger.getLogger('Adyen').error('Session variable MD does not exists');
    app.getController('COSummary').Start({
      PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', ''),
    });
    return {};
  }
}

/**
 * Clear system session data
 */
function clearForms() {
  // Clears all forms used in the checkout process.
  session.forms.singleshipping.clearFormElement();
  session.forms.multishipping.clearFormElement();
  session.forms.billing.clearFormElement();

  clearCustomSessionFields();
}

/**
 * Clear custom session data
 */
function clearCustomSessionFields() {
  // Clears all fields used in the 3d secure payment.
  session.privacy.adyenResponse = null;
  session.privacy.paymentMethod = null;
  session.privacy.orderNo = null;
  session.privacy.adyenBrandCode = null;
  session.privacy.adyenIssuerID = null;
}

function getExternalPlatformVersion() {
  return EXTERNAL_PLATFORM_VERSION;
}

function getAction() {
  if (!session.privacy.orderNo || !session.privacy.paymentMethod) {
    throw3D2Error('Session variables for 3DS2 do not exist');
    return;
  }
  const order = OrderMgr.getOrder(session.privacy.orderNo);
  const paymentInstrument = order?.getPaymentInstruments(
      session.privacy.paymentMethod,
  )[0];
  if(!paymentInstrument) {
    throw3D2Error('Unable to retrieve order data from session 3DS2.');
    return;
  }
  return paymentInstrument.custom.adyenAction;
}

function throw3D2Error(message) {
  Logger.getLogger('Adyen').error(message);
  app.getController('COSummary').Start({
    PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', ''),
  });
}

exports.Authorize3DS2 = guard.ensure(['https', 'post'], authorize3ds2);

exports.Redirect3DS2 = guard.ensure(['https', 'post'], redirect3ds2);

exports.AuthorizeWithForm = guard.ensure(['https', 'post'], authorizeWithForm);

exports.Notify = guard.ensure(['post'], notify);

exports.Redirect = redirect;

exports.ShowConfirmation = guard.httpsGet(showConfirmation);

exports.ShowConfirmationPaymentFromComponent = guard.ensure(
  ['https'],
  showConfirmationPaymentFromComponent,
);

exports.OrderConfirm = guard.httpsGet(orderConfirm);

exports.GetPaymentMethods = getPaymentMethods;

exports.getExternalPlatformVersion = getExternalPlatformVersion();

exports.PaymentFromComponent = guard.ensure(
  ['https', 'post'],
  paymentFromComponent,
);

exports.Donate = guard.ensure(['https', 'post'], donate);
