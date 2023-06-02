"use strict";

var Resource = require('dw/web/Resource');
var URLUtils = require('dw/web/URLUtils');
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');
var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
var PaymentMgr = require('dw/order/PaymentMgr');

/* Script Modules */
var app = require('app_storefront_controllers/cartridge/scripts/app');
var guard = require('app_storefront_controllers/cartridge/scripts/guard');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var adyenSessions = require('*/cartridge/scripts/adyenSessions');
var constants = require('*/cartridge/adyenConstants/constants');
var paymentMethodDescriptions = require('*/cartridge/adyenConstants/paymentMethodDescriptions');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
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
    AdyenLogs.error_log("Error during 3ds1 response verification: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    return response.redirect(URLUtils.https('PaymentInstruments-List', 'error', 'AuthorisationFailed'));
  }
}

/**
 * Show confirmation after return from Adyen
 */
function showConfirmation() {
  try {
    var redirectResult = request.httpParameterMap.get('redirectResult').stringValue;
    var payload = request.httpParameterMap.get('payload').stringValue;
    var signature = request.httpParameterMap.get('signature').stringValue;
    var merchantReference = request.httpParameterMap.get('merchantReference').stringValue;
    var orderToken = request.httpParameterMap.get('orderToken').stringValue;
    var authorized = request.httpParameterMap.get('authorized').stringValue;
    var error = request.httpParameterMap.get('error').stringValue;
    var order = OrderMgr.getOrder(merchantReference, orderToken);

    // if the payment is authorized, we can navigate to order confirm
    if (authorized === 'true') {
      clearForms();
      return app.getController('COSummary').ShowConfirmation(order);
    }

    //if there is an eror, we nagivate and display the erorr
    if (error === 'true') {
      var _errorStatus = request.httpParameterMap.get('errorStatus').stringValue;
      return app.getController('COSummary').Start({
        PlaceOrderError: new Status(Status.ERROR, _errorStatus)
      });
    }
    var adyenPaymentInstrument = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT)[0];
    if (adyenPaymentInstrument.paymentTransaction.custom.Adyen_merchantSig === signature) {
      if (order.status.value === Order.ORDER_STATUS_FAILED) {
        AdyenLogs.error_log("Could not call payment/details for failed order ".concat(order.orderNo));
        return response.redirect(URLUtils.httpHome());
      }
      var details = redirectResult ? {
        redirectResult: redirectResult
      } : {
        payload: payload
      };
      var hasQuerystringDetails = !!(details.redirectResult || details.payload);
      // Saved response from Adyen-PaymentsDetails
      var detailsResult = JSON.parse(adyenPaymentInstrument.paymentTransaction.custom.Adyen_authResult);
      if (hasQuerystringDetails) {
        var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
        detailsResult = adyenCheckout.doPaymentsDetailsCall({
          details: details
        });
        clearAdyenData(adyenPaymentInstrument);
      }
      if ([constants.RESULTCODES.AUTHORISED, constants.RESULTCODES.PENDING, constants.RESULTCODES.RECEIVED].indexOf(detailsResult.resultCode) > -1) {
        Transaction.wrap(function () {
          AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, detailsResult);
        });
        clearForms();
        return app.getController('COSummary').ShowConfirmation(order);
      }
      // fail order
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
      AdyenLogs.error_log("Payment failed, result: ".concat(JSON.stringify(detailsResult)));
    } else {
      // fail order
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
      AdyenLogs.error_log("Payment failed, reason: invalid signature");
    }

    // should be assingned by previous calls or not
    var errorStatus = new dw.system.Status(dw.system.Status.ERROR, 'confirm.error.declined');
    app.getController('COSummary').Start({
      PlaceOrderError: errorStatus
    });
  } catch (e) {
    AdyenLogs.error_log("Could not verify showConfirmation: ".concat(e.message, " more details: ").concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
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
    var data = requestBody.data;
    var isAmazonpay = data.paymentMethod === 'amazonpay';
    data.paymentMethod = undefined;
    var paymentsDetailsResponse = adyenCheckout.doPaymentsDetailsCall(data);
    var _response = AdyenHelper.createAdyenCheckoutResponse(paymentsDetailsResponse);
    if (isAmazonpay) {
      _response.fullResponse = {
        pspReference: paymentsDetailsResponse.pspReference,
        paymentMethod: paymentsDetailsResponse.additionalData.paymentMethod,
        resultCode: paymentsDetailsResponse.resultCode
      };
    }

    //check if payment is not zero auth for my account
    if (paymentsDetailsResponse.merchantReference !== 'recurringPayment-account') {
      var order = OrderMgr.getOrder(paymentsDetailsResponse.merchantReference, requestBody.orderToken);
      var paymentInstruments = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);
      var signature = AdyenHelper.createSignature(paymentInstruments[0], order.getUUID(), paymentsDetailsResponse.merchantReference);
      Transaction.wrap(function () {
        paymentInstruments[0].paymentTransaction.custom.Adyen_authResult = JSON.stringify(paymentsDetailsResponse);
      });
      _response.redirectUrl = URLUtils.url('Adyen-ShowConfirmation', 'merchantReference', _response.merchantReference, 'orderToken', requestBody.orderToken, 'signature', signature).toString();
    }
    var responseUtils = require('*/cartridge/scripts/util/Response');
    responseUtils.renderJSON({
      response: _response
    });
  } catch (e) {
    AdyenLogs.error_log("Could not verify /payment/details: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    return response.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  }
}

/**
 * Make a payment from inside a component (used by paypal)
 */
function paymentFromComponent() {
  if (request.httpParameterMap.getRequestBodyAsString().indexOf('cancelTransaction') > -1) {
    var merchantReference = JSON.parse(request.httpParameterMap.getRequestBodyAsString()).merchantReference;
    AdyenLogs.info_log("Shopper cancelled paymentFromComponent transaction for order ".concat(merchantReference));
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
      } catch (e) {
        // Error parsing paymentMethod
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
    // Decline flow for Amazon pay is handled different from other Component PMs
    // Order needs to be failed here to handle Amazon decline flow.
    if (paymentInstrument.custom.adyenPaymentMethod === 'amazonpay' && result.adyenErrorMessage) {
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
    }
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
  var _finalResult;
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
  var amazonPayResult;
  var hasStateData = stateData && stateData.details && stateData.paymentData;
  if (!hasStateData) {
    if (result && JSON.stringify(result).indexOf('amazonpay') > -1) {
      amazonPayResult = JSON.parse(result);
    } else {
      // The billing step is fulfilled, but order will be failed
      app.getForm('billing').object.fulfilled.value = true;
      // fail order if no stateData available
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
      app.getController('COBilling').Start();
      return {};
    }
  }
  var details = stateData.details;
  var paymentData = stateData.paymentData;

  // redirect to payment/details
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
  var finalResult;
  if (order.status.value === Order.ORDER_STATUS_CREATED) {
    finalResult = amazonPayResult || adyenCheckout.doPaymentsDetailsCall(requestObject);
  }
  if ([constants.RESULTCODES.AUTHORISED, constants.RESULTCODES.PENDING, constants.RESULTCODES.RECEIVED].indexOf((_finalResult = finalResult) === null || _finalResult === void 0 ? void 0 : _finalResult.resultCode) > -1) {
    Transaction.wrap(function () {
      AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, finalResult);
    });
    clearForms();
    app.getController('COSummary').ShowConfirmation(order);
    return {};
  }
  // handles the refresh
  else if ([Order.ORDER_STATUS_CREATED, Order.ORDER_STATUS_NEW, Order.ORDER_STATUS_OPEN].indexOf(order.status.value) > -1) {
    clearForms();
    return app.getController('COSummary').ShowConfirmation(order);
  }
  // fail order
  Transaction.wrap(function () {
    OrderMgr.failOrder(order, true);
  });
  // should be assingned by previous calls or not
  var errorStatus = new dw.system.Status(dw.system.Status.ERROR, 'confirm.error.declined');
  app.getController('COSummary').Start({
    PlaceOrderError: errorStatus
  });
  return {};
}
function getConnectedTerminals() {
  var adyenTerminalApi = require('*/cartridge/scripts/adyenTerminalApi');
  if (PaymentMgr.getPaymentMethod(constants.METHOD_ADYEN_POS).isActive()) {
    return adyenTerminalApi.getTerminals().response;
  }
  return '{}';
}
function getCountryCode(currentBasket) {
  var _currentBasket$getShi;
  var Locale = require('dw/util/Locale');
  var countryCode = Locale.getLocale(request.getLocale()).country;
  var firstItem = (_currentBasket$getShi = currentBasket.getShipments()) === null || _currentBasket$getShi === void 0 ? void 0 : _currentBasket$getShi[0];
  if (firstItem !== null && firstItem !== void 0 && firstItem.shippingAddress) {
    return firstItem.shippingAddress.getCountryCode().value;
  }
  return countryCode;
}

/**
 * Make a request to Adyen to create a new session
 */
function sessions(customer) {
  try {
    var currentBasket = BasketMgr.getCurrentBasket();
    var countryCode = getCountryCode(currentBasket);
    var _response2 = adyenSessions.createSession(currentBasket, AdyenHelper.getCustomer(customer), countryCode);
    var adyenURL = "".concat(AdyenHelper.getLoadingContext(), "images/logos/medium/");
    var connectedTerminals = getConnectedTerminals();
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
    var responseJSON = {
      id: _response2.id,
      sessionData: _response2.sessionData,
      imagePath: adyenURL,
      adyenDescriptions: paymentMethodDescriptions,
      amount: {
        value: paymentAmount.value,
        currency: currency
      },
      countryCode: countryCode,
      adyenConnectedTerminals: JSON.parse(connectedTerminals),
      shippingAddress: shippingAddress
    };
    return responseJSON;
  } catch (error) {
    AdyenLogs.fatal_log("Failed to create Adyen Checkout Session... ".concat(error.toString()));
  }
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
    AdyenLogs.error_log(e);
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
    } catch (e) {
      // Error parsing terminal response
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

/**
 * Clear system session data
 */
function clearAdyenData(paymentInstrument) {
  Transaction.wrap(function () {
    paymentInstrument.custom.adyenPaymentData = null;
    paymentInstrument.custom.adyenMD = null;
    paymentInstrument.paymentTransaction.custom.Adyen_authResult = null;
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
exports.Notify = guard.ensure(['post'], notify);
exports.ShowConfirmation = guard.httpsGet(showConfirmation);
exports.ShowConfirmationPaymentFromComponent = guard.ensure(['https'], showConfirmationPaymentFromComponent);
exports.Redirect3DS1Response = guard.ensure(['https'], Redirect3DS1Response);
exports.GetPaymentMethods = getPaymentMethods;
exports.Sessions = sessions;
exports.getExternalPlatformVersion = getExternalPlatformVersion();
exports.PaymentFromComponent = guard.ensure(['https', 'post'], paymentFromComponent);
exports.ZeroAuth = guard.ensure(['https', 'post'], zeroAuth);
exports.PaymentsDetails = guard.ensure(['https', 'post'], paymentsDetails);
exports.Donate = guard.ensure(['https', 'post'], donate);