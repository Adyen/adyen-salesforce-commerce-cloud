"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 * Passes on credit card details to Adyen using the Adyen PAL adapter
 * Receives a response and sets the order status accordingly
 * created on 23dec2014
 *
 * @input Order : dw.order.Order
 * @input Amount : dw.value.Money The amount to authorize
 * @input PaymentInstrument : dw.order.PaymentInstrument
 * @input CurrentSession : dw.system.Session
 * @input CurrentRequest : dw.system.Request
 * @input CreditCardForm : dw.web.Form
 * @input SaveCreditCard : Boolean
 *
 * @output Decision : String
 * @output PaymentStatus : String
 * @output AuthorizationCode :  String
 * @output AuthorizationAmount : String
 * @output PaRequest : String
 * @output PspReference : String
 * @output MD : String
 * @output ResultCode : String
 * @output IssuerUrl : String
 * @output AVSResultCode : String
 * @output AdyenErrorMessage : String
 * @output AdyenAmount : String
 * @output AdyenCardType : String
 *
 */

/* API Includes */
var Logger = require('dw/system/Logger');
/* Script Modules */


var Resource = require('dw/web/Resource');

var Order = require('dw/order/Order');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var RiskDataHelper = require('*/cartridge/scripts/util/riskDataHelper');

var AdyenGetOpenInvoiceData = require('*/cartridge/scripts/adyenGetOpenInvoiceData');

var adyenLevelTwoThreeData = require('*/cartridge/scripts/adyenLevelTwoThreeData');

function createPaymentRequest(args) {
  try {
    var order = args.Order;
    var paymentInstrument = args.PaymentInstrument; // Create request object with payment details

    var paymentRequest = AdyenHelper.createAdyenRequestObject(order, paymentInstrument); // Add Risk data

    if (AdyenHelper.getAdyenBasketFieldsEnabled()) {
      paymentRequest.additionalData = RiskDataHelper.createBasketContentFields(order);
    } // Get 3DS2 data


    if (AdyenHelper.getAdyen3DS2Enabled()) {
      paymentRequest = AdyenHelper.add3DS2Data(paymentRequest);
    } // L2/3 Data


    if (AdyenHelper.getAdyenLevel23DataEnabled()) {
      paymentRequest.additionalData = _objectSpread(_objectSpread({}, paymentRequest.additionalData), adyenLevelTwoThreeData.getLineItems(args));
    }

    var myAmount = AdyenHelper.getCurrencyValueForApi(paymentInstrument.paymentTransaction.amount).getValueOrNull(); // args.Amount * 100;

    paymentRequest.amount = {
      currency: paymentInstrument.paymentTransaction.amount.currencyCode,
      value: myAmount
    };
    var paymentMethodType = paymentRequest.paymentMethod.type; // Create billing and delivery address objects for new orders,
    // no address fields for credit cards through My Account

    paymentRequest = AdyenHelper.createAddressObjects(order, paymentMethodType, paymentRequest); // Create shopper data fields

    paymentRequest = AdyenHelper.createShopperObject({
      order: order,
      paymentRequest: paymentRequest
    });

    if (session.privacy.adyenFingerprint) {
      paymentRequest.deviceFingerprint = session.privacy.adyenFingerprint;
    } // Set open invoice data


    if (AdyenHelper.isOpenInvoiceMethod(paymentRequest.paymentMethod.type)) {
      paymentRequest.lineItems = AdyenGetOpenInvoiceData.getLineItems(args);

      if (paymentRequest.paymentMethod.type.indexOf('ratepay') > -1 && session.privacy.ratePayFingerprint) {
        paymentRequest.deviceFingerprint = session.privacy.ratePayFingerprint;
      }
    } // Add empty browserInfo for GooglePay


    if (paymentMethodType === 'paywithgoogle') {
      paymentRequest.browserInfo = {};
    } // make API call


    return doPaymentCall(order, paymentInstrument, paymentRequest);
  } catch (e) {
    Logger.getLogger('Adyen').error("error processing payment. Error message: ".concat(e.message, " more details: ").concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    return {
      error: true
    };
  }
}

function doPaymentCall(order, paymentInstrument, paymentRequest) {
  var paymentResponse = {};
  var errorMessage = '';

  try {
    var callResult = executeCall(AdyenHelper.SERVICE.PAYMENT, paymentRequest);

    if (callResult.isOk() === false) {
      Logger.getLogger('Adyen').error("Adyen: Call error code".concat(callResult.getError().toString(), " Error => ResponseStatus: ").concat(callResult.getStatus(), " | ResponseErrorText: ").concat(callResult.getErrorMessage(), " | ResponseText: ").concat(callResult.getMsg()));
      paymentResponse.adyenErrorMessage = Resource.msg('confirm.error.declined', 'checkout', null);
      return {
        error: true,
        args: paymentResponse
      };
    }

    var resultObject = callResult.object;

    if (!resultObject || !resultObject.getText()) {
      throw new Error("No correct response from ".concat(AdyenHelper.SERVICE.PAYMENT, ", result: ").concat(JSON.stringify(resultObject)));
    } // build the response object


    var responseObject;

    try {
      responseObject = JSON.parse(resultObject.getText());
    } catch (ex) {
      Logger.getLogger('Adyen').error("error parsing response object ".concat(ex.message));
      return {
        error: true
      };
    } // There is no order for zero auth transactions.
    // Return response directly to PaymentInstruments-SavePayment


    if (!order) {
      return responseObject;
    }

    paymentResponse.fullResponse = responseObject;
    paymentResponse.redirectObject = responseObject.redirect ? responseObject.redirect : '';
    paymentResponse.resultCode = responseObject.resultCode;
    paymentResponse.pspReference = responseObject.pspReference ? responseObject.pspReference : '';
    paymentResponse.adyenAmount = paymentRequest.amount.value;
    paymentResponse.decision = 'ERROR';

    if (responseObject.additionalData) {
      order.custom.Adyen_paymentMethod = responseObject.additionalData.paymentMethod ? responseObject.additionalData.paymentMethod : null;
    } // Check the response object from /payment call


    if (paymentResponse.resultCode === 'IdentifyShopper' || paymentResponse.resultCode === 'ChallengeShopper') {
      if (responseObject.action) {
        paymentInstrument.custom.adyenAction = JSON.stringify(responseObject.action);
      }

      paymentResponse.decision = 'ACCEPT';
      paymentResponse.threeDS2 = true;
      var token3ds2;

      if (responseObject.authentication['threeds2.fingerprintToken']) {
        token3ds2 = responseObject.authentication['threeds2.fingerprintToken'];
      } else if (responseObject.authentication['threeds2.challengeToken']) {
        token3ds2 = responseObject.authentication['threeds2.challengeToken'];
      }

      paymentResponse.token3ds2 = token3ds2;
      paymentResponse.paymentData = responseObject.paymentData;
    } else if (paymentResponse.resultCode === 'Authorised' || paymentResponse.resultCode === 'RedirectShopper') {
      paymentResponse.decision = 'ACCEPT';
      paymentResponse.paymentData = responseObject.paymentData; // if 3D Secure is used, the statuses will be updated later

      if (paymentResponse.resultCode === 'Authorised') {
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        order.setExportStatus(Order.EXPORT_STATUS_READY);
        Logger.getLogger('Adyen').info('Payment result: Authorised');
      }
    } else if (paymentResponse.resultCode === 'PresentToShopper') {
      paymentResponse.decision = 'ACCEPT';

      if (responseObject.action) {
        paymentInstrument.custom.adyenAction = JSON.stringify(responseObject.action);
      }

      if (responseObject.outputDetails) {
        var outputDetailsData = [];

        for (var data in responseObject.outputDetails) {
          outputDetailsData.push({
            key: data,
            value: responseObject.outputDetails[data]
          });
        }

        paymentInstrument.custom.adyenAdditionalPaymentData = JSON.stringify(outputDetailsData);
      }
    } else if (paymentResponse.resultCode === 'Received') {
      paymentResponse.decision = 'ACCEPT';

      if (responseObject.additionalData['bankTransfer.owner']) {
        var bankTransferData = [{
          key: 'bankTransfer.description',
          value: 'bankTransfer.description'
        }];

        for (var _data in responseObject.additionalData) {
          if (_data.indexOf('bankTransfer.') !== -1) {
            bankTransferData.push({
              key: _data,
              value: responseObject.additionalData[_data]
            });
          }
        }

        paymentInstrument.custom.adyenAdditionalPaymentData = JSON.stringify(bankTransferData);
      }

      if (responseObject.additionalData['comprafacil.entity']) {
        var multiBancoData = [{
          key: 'comprafacil.description',
          value: 'comprafacil.description'
        }];

        for (var _data2 in responseObject.additionalData) {
          if (_data2.indexOf('comprafacil.') !== -1) {
            multiBancoData.push({
              key: _data2,
              value: responseObject.additionalData[_data2]
            });
          }
        }

        paymentInstrument.custom.adyenAdditionalPaymentData = JSON.stringify(multiBancoData);
      }

      order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
      order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
    } else {
      paymentResponse.decision = 'REFUSED';
      order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
      order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
      errorMessage = Resource.msg('confirm.error.declined', 'checkout', null);

      if (responseObject.refusalReason) {
        errorMessage += " (".concat(responseObject.refusalReason, ")");
      }

      paymentResponse.adyenErrorMessage = errorMessage;
      Logger.getLogger('Adyen').info('Payment result: Refused');
    }

    return paymentResponse;
  } catch (e) {
    Logger.getLogger('Adyen').fatal("Adyen: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    return {
      error: true
    };
  }
}

function doPaymentDetailsCall(paymentDetailsRequest) {
  var callResult = executeCall(AdyenHelper.SERVICE.PAYMENTDETAILS, paymentDetailsRequest);

  if (callResult.isOk() === false) {
    Logger.getLogger('Adyen').error("Adyen: Call error code".concat(callResult.getError().toString(), " Error => ResponseStatus: ").concat(callResult.getStatus(), " | ResponseErrorText: ").concat(callResult.getErrorMessage(), " | ResponseText: ").concat(callResult.getMsg()));
    return {
      error: true,
      invalidRequest: true
    };
  }

  var resultObject = callResult.object;

  if (!resultObject || !resultObject.getText()) {
    Logger.getLogger('Adyen').error("Error in /payment/details response, response: ".concat(JSON.stringify(resultObject)));
    return {
      error: true
    };
  } // build the response object


  var responseObject;

  try {
    responseObject = JSON.parse(resultObject.getText());
  } catch (ex) {
    Logger.getLogger('Adyen').error("error parsing response object ".concat(ex.message));
    return {
      error: true
    };
  }

  return responseObject;
}

function executeCall(serviceType, requestObject) {
  var service = AdyenHelper.getService(serviceType);

  if (service === null) {
    return {
      error: true
    };
  }

  var apiKey = AdyenHelper.getAdyenApiKey();
  service.addHeader('Content-type', 'application/json');
  service.addHeader('charset', 'UTF-8');
  service.addHeader('X-API-KEY', apiKey);
  var callResult = service.call(JSON.stringify(requestObject));
  return callResult;
}

module.exports = {
  createPaymentRequest: createPaymentRequest,
  doPaymentCall: doPaymentCall,
  doPaymentDetailsCall: doPaymentDetailsCall
};