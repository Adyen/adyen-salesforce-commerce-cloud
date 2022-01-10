"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var Resource = require('dw/web/Resource');

var URLUtils = require('dw/web/URLUtils');

var OrderMgr = require('dw/order/OrderMgr');

var BasketMgr = require('dw/order/BasketMgr');

var Status = require('dw/system/Status');

var Transaction = require('dw/system/Transaction');

var PaymentMgr = require('dw/order/PaymentMgr');

var CSRFProtection = require('dw/web/CSRFProtection');
/* Script Modules */


var app = require('app_storefront_controllers/cartridge/scripts/app');

var guard = require('app_storefront_controllers/cartridge/scripts/guard');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var OrderModel = app.getModel('Order');

var Logger = require('dw/system/Logger');

var constants = require('*/cartridge/adyenConstants/constants');

var EXTERNAL_PLATFORM_VERSION = 'SiteGenesis';
/**
 * Controller for all storefront processes.
 *
 * @module controllers/Adyen
 */

/**
 * Called by Adyen to update status of payments. It should always display [accepted] when finished.
 */

function notify() {
  var checkAuth = require('*/cartridge/scripts/checkNotificationAuth');

  var status = checkAuth.check(request);

  if (!status) {
    app.getView().render('adyen/error');
    return {};
  }

  var handleNotify = require('*/cartridge/scripts/handleNotify');

  Transaction.begin();
  var notificationResult = handleNotify.notifyHttpParameterMap(request.httpParameterMap);

  if (notificationResult.success) {
    Transaction.commit();
    app.getView().render('notify');
  } else {
    app.getView({
      errorMessage: notificationResult.errorMessage
    }).render('/notifyError');
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
 * Performs a zero auth transaction to add a card to an account
 */


function zeroAuth() {
  var adyenZeroAuth = require('*/cartridge/scripts/adyenZeroAuth');

  var wallet = customer.getProfile().getWallet();
  var stateDataStr = request.httpParameterMap.getRequestBodyAsString();
  var paymentInstrument;
  Transaction.wrap(function () {
    paymentInstrument = wallet.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT);
    paymentInstrument.custom.adyenPaymentData = stateDataStr;
  });
  Transaction.begin();
  var zeroAuthResult = adyenZeroAuth.zeroAuthPayment(customer, paymentInstrument);

  if (zeroAuthResult.error) {
    Transaction.rollback();
    return false;
  }

  Transaction.commit();

  var responseUtils = require('*/cartridge/scripts/util/Response');

  responseUtils.renderJSON({
    zeroAuthResult: zeroAuthResult
  });
}
/**
 * Redirect to Adyen after 3DS1 Authentication When adding a card to an account
 */


function Redirect3DS1Response() {
  try {
    var redirectResult = request.httpParameterMap.get('redirectResult').stringValue;
    var jsonRequest = {
      details: {
        redirectResult: redirectResult
      }
    };

    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    var result = adyenCheckout.doPaymentsDetailsCall(jsonRequest);

    if (result.resultCode === 'Authorised') {
      return response.redirect(URLUtils.https('PaymentInstruments-List'));
    } else {
      return response.redirect(URLUtils.https('PaymentInstruments-List', 'error', 'AuthorisationFailed'));
    }
  } catch (e) {
    Logger.getLogger('Adyen').error("Error during 3ds1 response verification: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    return response.redirect(URLUtils.https('PaymentInstruments-List', 'error', 'AuthorisationFailed'));
  }
}
/**
 * Show confirmation after return from Adyen
 */


function showConfirmation() {
  try {
    var orderNumber = request.httpParameterMap.get('merchantReference').stringValue;
    var orderToken = request.httpParameterMap.get('orderToken').stringValue;
    var order = OrderMgr.getOrder(orderNumber, orderToken);
    var paymentInstruments = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);
    var adyenPaymentInstrument;
    var paymentData;
    var instrumentsIter = paymentInstruments.iterator();

    while (instrumentsIter.hasNext()) {
      adyenPaymentInstrument = instrumentsIter.next();
      paymentData = adyenPaymentInstrument.custom.adyenPaymentData;
    } // redirect to payment/details


    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    var requestObject = {
      details: getDetails(),
      paymentData: paymentData
    };
    var result = adyenCheckout.doPaymentsDetailsCall(requestObject);
    clearAdyenData(adyenPaymentInstrument);

    if (result.invalidRequest) {
      Logger.getLogger('Adyen').error('Invalid /payments/details call');
      return response.redirect(URLUtils.httpHome());
    }

    var merchantRefOrder = OrderMgr.getOrder(result.merchantReference, orderToken);
    var paymentInstrument = merchantRefOrder.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT)[0];

    if (['Authorised', 'Pending', 'Received', 'PresentToShopper'].indexOf(result.resultCode) > -1) {
      Transaction.wrap(function () {
        AdyenHelper.savePaymentDetails(paymentInstrument, merchantRefOrder, result);
      });
      OrderModel.submit(merchantRefOrder);
      clearForms();
      return app.getController('COSummary').ShowConfirmation(merchantRefOrder);
    } // fail order


    Transaction.wrap(function () {
      OrderMgr.failOrder(merchantRefOrder, true);
    });
    Logger.getLogger('Adyen').error("Payment failed, result: ".concat(JSON.stringify(result))); // should be assingned by previous calls or not

    var errorStatus = new dw.system.Status(dw.system.Status.ERROR, 'confirm.error.declined');
    app.getController('COSummary').Start({
      PlaceOrderError: errorStatus
    });
  } catch (e) {
    Logger.getLogger('Adyen').error("Could not verify showConfirmation: ".concat(e.message, " more details: ").concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
  }

  return {};
}
/**
 *  Confirm payment status after receiving redirectResult from Adyen
 */


function paymentsDetails() {
  try {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    var requestBody = JSON.parse(request.httpParameterMap.getRequestBodyAsString());
    var isAmazonpay = requestBody.paymentMethod === 'amazonpay';
    requestBody.paymentMethod = undefined;
    var paymentsDetailsResponse = adyenCheckout.doPaymentsDetailsCall(requestBody);

    var _response = AdyenHelper.createAdyenCheckoutResponse(paymentsDetailsResponse);

    if (isAmazonpay) {
      _response.fullResponse = {
        pspReference: paymentsDetailsResponse.pspReference,
        paymentMethod: paymentsDetailsResponse.additionalData.paymentMethod,
        resultCode: paymentsDetailsResponse.resultCode
      };
    }

    var responseUtils = require('*/cartridge/scripts/util/Response');

    responseUtils.renderJSON({
      response: _response
    });
  } catch (e) {
    Logger.getLogger('Adyen').error("Could not verify /payment/details: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    return response.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  }
}

function getDetails() {
  var _request$httpParamete = request.httpParameterMap,
      redirectResult = _request$httpParamete.redirectResult,
      payload = _request$httpParamete.payload;
  return _objectSpread(_objectSpread({}, redirectResult.value && {
    redirectResult: redirectResult.value
  }), payload.value && {
    payload: payload.value
  });
}
/**
 * Make a payment from inside a component (used by paypal)
 */


function paymentFromComponent() {
  if (request.httpParameterMap.getRequestBodyAsString().indexOf('cancelTransaction') > -1) {
    var merchantReference = JSON.parse(request.httpParameterMap.getRequestBodyAsString()).merchantReference;
    Logger.getLogger('Adyen').error("Shopper cancelled paymentFromComponent transaction for order ".concat(merchantReference));
    return;
  } else {
    var adyenRemovePreviousPI = require('*/cartridge/scripts/adyenRemovePreviousPI');

    var currentBasket = BasketMgr.getCurrentBasket();

    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    var paymentInstrument;
    var order;
    Transaction.wrap(function () {
      var result = adyenRemovePreviousPI.removePaymentInstruments(currentBasket);

      if (result.error) {
        return result;
      }

      var stateDataStr = request.httpParameterMap.getRequestBodyAsString();
      paymentInstrument = currentBasket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, currentBasket.totalGrossPrice);

      var _PaymentMgr$getPaymen = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod),
          paymentProcessor = _PaymentMgr$getPaymen.paymentProcessor;

      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
      paymentInstrument.custom.adyenPaymentData = stateDataStr;

      try {
        paymentInstrument.custom.adyenPaymentMethod = JSON.parse(stateDataStr).paymentMethod.type;
      } catch (e) {// Error parsing paymentMethod
      }
    });
    order = OrderMgr.createOrder(currentBasket);
    Transaction.begin();
    var result = adyenCheckout.createPaymentRequest({
      Order: order,
      PaymentInstrument: paymentInstrument
    });
    result.orderNo = order.orderNo;
    result.orderToken = order.getOrderToken();
    Transaction.commit();

    var responseUtils = require('*/cartridge/scripts/util/Response');

    responseUtils.renderJSON({
      result: result
    });
  }
}
/**
 * Show confirmation for payments completed from component directly e.g. paypal, QRcode, ..
 */


function showConfirmationPaymentFromComponent() {
  var paymentInformation = app.getForm('adyPaydata');
  var orderNumber = paymentInformation.get('merchantReference').value();
  var orderToken = paymentInformation.get('orderToken').value();
  var result = paymentInformation.get('result').value();
  var order = OrderMgr.getOrder(orderNumber, orderToken);
  var paymentInstruments = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);
  var adyenPaymentInstrument;
  var instrumentsIter = paymentInstruments.iterator();

  while (instrumentsIter.hasNext()) {
    adyenPaymentInstrument = instrumentsIter.next();
  }

  var stateData = JSON.parse(paymentInformation.get('paymentFromComponentStateData').value());
  var finalResult;
  var hasStateData = stateData && stateData.details && stateData.paymentData;

  if (!hasStateData) {
    if (result && JSON.stringify(result).indexOf('amazonpay') > -1) {
      finalResult = JSON.parse(result);
    } else {
      // The billing step is fulfilled, but order will be failed
      app.getForm('billing').object.fulfilled.value = true; // fail order if no stateData available

      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
      app.getController('COBilling').Start();
      return {};
    }
  }

  var details = stateData.details;
  var paymentData = stateData.paymentData; // redirect to payment/details

  var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

  var requestObject = {
    details: details,
    paymentData: paymentData
  };
  var paymentProcessor = PaymentMgr.getPaymentMethod(adyenPaymentInstrument.getPaymentMethod()).getPaymentProcessor();
  Transaction.wrap(function () {
    adyenPaymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    adyenPaymentInstrument.custom.adyenPaymentData = null;
  });
  finalResult = finalResult || adyenCheckout.doPaymentsDetailsCall(requestObject);

  if (['Authorised', 'Pending', 'Received'].indexOf(finalResult.resultCode) > -1) {
    Transaction.wrap(function () {
      AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, finalResult);
    });
    OrderModel.submit(order);
    clearForms();
    app.getController('COSummary').ShowConfirmation(order);
    return {};
  } // fail order


  Transaction.wrap(function () {
    OrderMgr.failOrder(order, true);
  }); // should be assingned by previous calls or not

  var errorStatus = new dw.system.Status(dw.system.Status.ERROR, 'confirm.error.declined');
  app.getController('COSummary').Start({
    PlaceOrderError: errorStatus
  });
  return {};
}
/**
 * Complete a donation through adyenGiving
 */


function donate() {
  var adyenGiving = require('*/cartridge/scripts/adyenGiving');

  var responseUtils = require('*/cartridge/scripts/util/Response');

  var req;

  try {
    req = JSON.parse(request.httpParameterMap.getRequestBodyAsString());
  } catch (e) {
    Logger.getLogger('Adyen').error(e);
  }

  var _req = req,
      pspReference = _req.pspReference;
  var _req2 = req,
      orderNo = _req2.orderNo;
  var donationAmount = {
    value: req.amountValue,
    currency: req.amountCurrency
  };
  var donationResult = adyenGiving.donate(orderNo, donationAmount, pspReference);
  responseUtils.renderJSON({
    response: donationResult.response
  });
}
/**
 * Separated order confirm for Credit cards and APM's.
 */


function orderConfirm(orderNo) {
  var order = null;

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
  var Locale = require('dw/util/Locale');

  var countryCode = Locale.getLocale(request.getLocale()).country;
  var currentBasket = BasketMgr.getCurrentBasket();

  if (currentBasket.getShipments().length > 0 && currentBasket.getShipments()[0].shippingAddress) {
    countryCode = currentBasket.getShipments()[0].shippingAddress.getCountryCode().value.toUpperCase();
  }

  var adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');

  var PaymentMgr = require('dw/order/PaymentMgr');

  var getPaymentMethods = require('*/cartridge/scripts/adyenGetPaymentMethods');

  var response = getPaymentMethods.getMethods(cart.object, customer, countryCode);
  var paymentMethodDescriptions = response.paymentMethods.map(function (method) {
    return {
      brandCode: method.type,
      description: Resource.msg("hpp.description.".concat(method.type), 'hpp', '')
    };
  });
  var adyenURL = "".concat(AdyenHelper.getLoadingContext(), "images/logos/medium/");
  var connectedTerminals = {};

  if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive()) {
    try {
      var connectedTerminalsResponse = adyenTerminalApi.getTerminals().response;

      if (connectedTerminalsResponse) {
        connectedTerminals = JSON.parse(connectedTerminalsResponse);
      }
    } catch (e) {// Error parsing terminal response
    }
  }

  var currency = currentBasket.getTotalGrossPrice().currencyCode;
  var paymentAmount = currentBasket.getTotalGrossPrice().isAvailable() ? AdyenHelper.getCurrencyValueForApi(currentBasket.getTotalGrossPrice()) : new dw.value.Money(1000, currency);
  var shippingForm = session.forms.singleshipping;
  var shippingAddress = {
    firstName: shippingForm.shippingAddress.addressFields.firstName.value,
    lastName: shippingForm.shippingAddress.addressFields.lastName.value,
    address1: shippingForm.shippingAddress.addressFields.address1.value,
    city: shippingForm.shippingAddress.addressFields.city.value,
    country: shippingForm.shippingAddress.addressFields.country.value,
    phone: shippingForm.shippingAddress.addressFields.phone.value,
    postalCode: shippingForm.shippingAddress.addressFields.postal.value
  };
  var jsonResponse = {
    adyenPaymentMethods: response,
    adyenConnectedTerminals: connectedTerminals,
    ImagePath: adyenURL,
    AdyenDescriptions: paymentMethodDescriptions,
    amount: {
      value: paymentAmount.value,
      currency: currency
    },
    countryCode: countryCode,
    shippingAddress: shippingAddress
  };
  return jsonResponse;
}

function redirect3ds2() {
  var clientKey = AdyenHelper.getAdyenClientKey();
  var environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
  var locale = request.getLocale();
  var orderNo = request.httpParameterMap.get('merchantReference').stringValue;
  var orderToken = request.httpParameterMap.get('orderToken').stringValue;
  var order = OrderMgr.getOrder(orderNo, orderToken);
  var paymentInstrument = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT)[0];
  var action = paymentInstrument.custom.adyenAction;
  Transaction.wrap(function () {
    paymentInstrument.custom.adyenAction = null;
  });
  app.getView({
    locale: locale,
    clientKey: clientKey,
    environment: environment,
    resultCode: request.httpParameterMap.get('resultCode').stringValue,
    action: action,
    merchantReference: orderNo,
    orderToken: orderToken,
    ContinueURL: URLUtils.https('Adyen-Authorize3DS2', 'merchantReference', orderNo, 'orderToken', orderToken)
  }).render('/threeds2/adyen3ds2');
}
/**
 * Make second call to /payments/details with IdentifyShopper or ChallengeShopper token
 *
 * @returns rendering template or error
 */


function authorize3ds2() {
  if (!CSRFProtection.validateRequest()) {
    Logger.getLogger('Adyen').error("CSRF Mismatch for order ".concat(request.httpParameterMap.get('merchantReference').stringValue));
    response.redirect(URLUtils.httpHome());
    return;
  }

  try {
    Transaction.begin();

    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    var orderNo = request.httpParameterMap.get('merchantReference').stringValue;
    var orderToken = request.httpParameterMap.get('orderToken').stringValue;
    var order = OrderMgr.getOrder(orderNo, orderToken);
    var paymentInstrument = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT)[0];
    var details = {};

    if (['IdentifyShopper', 'ChallengeShopper'].indexOf(request.httpParameterMap.get('resultCode').stringValue) !== -1 || request.httpParameterMap.get('challengeResult').stringValue) {
      details = JSON.parse(request.httpParameterMap.get('stateData').stringValue).details;
    } else {
      Logger.getLogger('Adyen').error('paymentDetails 3DS2 not available');
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
      app.getController('COSummary').Start({
        PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', '')
      });
      return {};
    }

    var paymentDetailsRequest = {
      paymentData: paymentInstrument.custom.adyenPaymentData,
      details: details
    };
    var result = adyenCheckout.doPaymentsDetailsCall(paymentDetailsRequest);

    if (result.invalidRequest) {
      Logger.getLogger('Adyen').error("Invalid request for order ".concat(orderNo));
      clearAdyenData(paymentInstrument);
      return response.redirect(URLUtils.httpHome());
    }

    var resultOrderNo = result.merchantReference || orderNo;
    var resultOrder = OrderMgr.getOrder(resultOrderNo, orderToken);

    if (!result.action && (result.error || result.resultCode !== 'Authorised')) {
      // Payment failed
      Transaction.wrap(function () {
        OrderMgr.failOrder(resultOrder, true);
        paymentInstrument.custom.adyenPaymentData = null;
      });
      app.getController('COSummary').Start({
        PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', '')
      });
      return {};
    }

    if (result.action) {
      app.getView({
        ContinueURL: URLUtils.https('Adyen-Redirect3DS2', 'merchantReference', resultOrderNo, 'utm_nooverride', '1'),
        action: JSON.stringify(result.action),
        merchantReference: resultOrderNo,
        orderToken: orderToken
      }).render('/threeds2/adyen3ds2');
      return {};
    }

    resultOrder.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
    resultOrder.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
    paymentInstrument.custom.adyenPaymentData = null;
    AdyenHelper.savePaymentDetails(paymentInstrument, resultOrder, result);
    Transaction.commit();
    OrderModel.submit(resultOrder);
    clearForms();
    app.getController('COSummary').ShowConfirmation(resultOrder);
  } catch (e) {
    Logger.getLogger('Adyen').error("Could not complete authorize3ds2: ".concat(e.message, " more details: ").concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
  }

  return {};
}
/**
 * Make /payments/details call to 3d verification system to complete authorization
 *
 * @returns rendering template or error
 */


function authorizeWithForm() {
  try {
    var MD = request.httpParameterMap.get('MD').stringValue;
    var PaRes = request.httpParameterMap.get('PaRes').stringValue;
    var orderNo = request.httpParameterMap.get('merchantReference').stringValue;
    var orderToken = request.httpParameterMap.get('orderToken').stringValue;
    var order = OrderMgr.getOrder(orderNo, orderToken);
    var paymentInstrument = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT)[0];
    clearCustomSessionFields(); // compare the MD from Adyen's payments response with the one from the issuer

    if (paymentInstrument.custom.adyenMD !== MD) {
      clearAdyenData(paymentInstrument);
      Logger.getLogger('Adyen').error("Incorrect MD for order ".concat(orderNo));
      return response.redirect(URLUtils.httpHome());
    }

    Transaction.begin();

    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    var jsonRequest = {
      details: {
        MD: MD,
        PaRes: PaRes
      }
    };
    var result = adyenCheckout.doPaymentsDetailsCall(jsonRequest);

    if (result.invalidRequest) {
      Logger.getLogger('Adyen').error("Invalid request for order ".concat(orderNo));
      return response.redirect(URLUtils.httpHome());
    }

    if (result.error || result.resultCode !== 'Authorised') {
      Transaction.rollback();
      clearAdyenData(paymentInstrument);
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
      app.getController('COSummary').Start({
        PlaceOrderError: new Status(Status.ERROR, 'confirm.error.declined', '')
      });
      return {};
    }

    order = OrderMgr.getOrder(result.merchantReference, orderToken);
    order.setPaymentStatus(dw.order.Order.PAYMENT_STATUS_PAID);
    order.setExportStatus(dw.order.Order.EXPORT_STATUS_READY);
    clearAdyenData(paymentInstrument);
    AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
    Transaction.commit();
    OrderModel.submit(order);
    clearForms();
    app.getController('COSummary').ShowConfirmation(order);
  } catch (e) {
    Logger.getLogger('Adyen').error("Could not verify authorizeWithForm: ".concat(e.message, " more details: ").concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
  }

  return {};
}
/**
 * Clear system session data
 */


function clearAdyenData(paymentInstrument) {
  Transaction.wrap(function () {
    paymentInstrument.custom.adyenPaymentData = null;
    paymentInstrument.custom.adyenMD = null;
  });
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

exports.Authorize3DS2 = guard.ensure(['https', 'post'], authorize3ds2);
exports.Redirect3DS2 = guard.ensure(['https', 'post'], redirect3ds2);
exports.AuthorizeWithForm = guard.ensure(['https', 'post'], authorizeWithForm);
exports.Notify = guard.ensure(['post'], notify);
exports.Redirect = redirect;
exports.ShowConfirmation = guard.httpsGet(showConfirmation);
exports.ShowConfirmationPaymentFromComponent = guard.ensure(['https'], showConfirmationPaymentFromComponent);
exports.Redirect3DS1Response = guard.ensure(['https'], Redirect3DS1Response);
exports.OrderConfirm = guard.httpsGet(orderConfirm);
exports.GetPaymentMethods = getPaymentMethods;
exports.getExternalPlatformVersion = getExternalPlatformVersion();
exports.PaymentFromComponent = guard.ensure(['https', 'post'], paymentFromComponent);
exports.ZeroAuth = guard.ensure(['https', 'post'], zeroAuth);
exports.PaymentsDetails = guard.ensure(['https', 'post'], paymentsDetails);
exports.Donate = guard.ensure(['https', 'post'], donate);