"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); if (enumerableOnly) { symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; }); } keys.push.apply(keys, symbols); } return keys; }

function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i] != null ? arguments[i] : {}; if (i % 2) { ownKeys(Object(source), true).forEach(function (key) { _defineProperty(target, key, source[key]); }); } else if (Object.getOwnPropertyDescriptors) { Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)); } else { ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } } return target; }

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

/**
 *                       ######
 *                       ######
 * ############    ####( ######  #####. ######  ############   ############
 * #############  #####( ######  #####. ######  #############  #############
 *        ######  #####( ######  #####. ######  #####  ######  #####  ######
 * ###### ######  #####( ######  #####. ######  #####  #####   #####  ######
 * ###### ######  #####( ######  #####. ######  #####          #####  ######
 * #############  #############  #############  #############  #####  ######
 *  ############   ############  #############   ############  #####  ######
 *                                      ######
 *                               #############
 *                               ############
 * Adyen Salesforce Commerce Cloud
 * Copyright (c) 2021 Adyen B.V.
 * This file is open source and available under the MIT license.
 * See the LICENSE file for more info.
 *
 * Passes on credit card details to Adyen using the Adyen PAL adapter
 * Receives a response and sets the order status accordingly
 * created on 23dec2014
 *
 */

/* API Includes */
var Logger = require('dw/system/Logger');

var Resource = require('dw/web/Resource');

var Order = require('dw/order/Order');

var Transaction = require('dw/system/Transaction');
/* Script Modules */


var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');

var RiskDataHelper = require('*/cartridge/scripts/util/riskDataHelper');

var AdyenGetOpenInvoiceData = require('*/cartridge/scripts/adyenGetOpenInvoiceData');

var adyenLevelTwoThreeData = require('*/cartridge/scripts/adyenLevelTwoThreeData');

var constants = require('*/cartridge/adyenConstants/constants'); //SALE payment methods require payment transaction type to be Capture


function setPaymentTransactionType(paymentInstrument, paymentMethod) {
  var salePaymentMethods = AdyenConfigs.getAdyenSalePaymentMethods();

  if (salePaymentMethods.indexOf(paymentMethod.type) > -1) {
    Transaction.wrap(function () {
      paymentInstrument.getPaymentTransaction().setType(dw.order.PaymentTransaction.TYPE_CAPTURE);
    });
  }
}

function createPaymentRequest(args) {
  try {
    var order = args.Order;
    var paymentInstrument = args.PaymentInstrument; // Create request object with payment details

    var paymentRequest = AdyenHelper.createAdyenRequestObject(order, paymentInstrument); // Add Risk data

    if (AdyenConfigs.getAdyenBasketFieldsEnabled()) {
      paymentRequest.additionalData = RiskDataHelper.createBasketContentFields(order);
    } // Get 3DS2 data


    if (AdyenConfigs.getAdyen3DS2Enabled()) {
      paymentRequest = AdyenHelper.add3DS2Data(paymentRequest);
    } // L2/3 Data


    if (AdyenConfigs.getAdyenLevel23DataEnabled()) {
      paymentRequest.additionalData = _objectSpread(_objectSpread({}, paymentRequest.additionalData), adyenLevelTwoThreeData.getLineItems(args));
    } // Add installments


    if (AdyenConfigs.getCreditCardInstallments()) {
      var _JSON$parse$installme;

      var numOfInstallments = (_JSON$parse$installme = JSON.parse(paymentInstrument.custom.adyenPaymentData).installments) === null || _JSON$parse$installme === void 0 ? void 0 : _JSON$parse$installme.value;

      if (numOfInstallments !== undefined) {
        paymentRequest.installments = {
          value: numOfInstallments
        };
      }
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
      args.addTaxPercentage = true;

      if (paymentRequest.paymentMethod.type.indexOf('klarna') > -1) {
        args.addTaxPercentage = false;
      }

      paymentRequest.lineItems = AdyenGetOpenInvoiceData.getLineItems(args);

      if (paymentRequest.paymentMethod.type.indexOf('ratepay') > -1 && session.privacy.ratePayFingerprint) {
        paymentRequest.deviceFingerprint = session.privacy.ratePayFingerprint;
      }
    }

    setPaymentTransactionType(paymentInstrument, paymentRequest.paymentMethod); // make API call

    return doPaymentsCall(order, paymentInstrument, paymentRequest);
  } catch (e) {
    Logger.getLogger('Adyen').error("error processing payment. Error message: ".concat(e.message, " more details: ").concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    return {
      error: true
    };
  }
}

function doPaymentsCall(order, paymentInstrument, paymentRequest) {
  var paymentResponse = {};
  var errorMessage = '';

  try {
    var callResult = executeCall(constants.SERVICE.PAYMENT, paymentRequest);

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
      throw new Error("No correct response from ".concat(constants.SERVICE.PAYMENT, ", result: ").concat(JSON.stringify(resultObject)));
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
    paymentResponse.redirectObject = responseObject.action ? responseObject.action : '';
    paymentResponse.resultCode = responseObject.resultCode;
    paymentResponse.pspReference = responseObject.pspReference ? responseObject.pspReference : '';
    paymentResponse.adyenAmount = paymentRequest.amount.value;
    paymentResponse.decision = 'ERROR';

    if (responseObject.additionalData) {
      order.custom.Adyen_paymentMethod = responseObject.additionalData.paymentMethod ? responseObject.additionalData.paymentMethod : null;
    }

    var acceptedResultCodes = [constants.RESULTCODES.AUTHORISED, constants.RESULTCODES.PENDING, constants.RESULTCODES.RECEIVED, constants.RESULTCODES.REDIRECTSHOPPER];
    var presentToShopperResultCodes = [constants.RESULTCODES.PRESENTTOSHOPPER];
    var refusedResultCodes = [constants.RESULTCODES.CANCELLED, constants.RESULTCODES.ERROR, constants.RESULTCODES.REFUSED];
    var resultCode = paymentResponse.resultCode; // Check the response object from /payment call

    if (acceptedResultCodes.indexOf(resultCode) !== -1) {
      paymentResponse.decision = 'ACCEPT'; // if 3D Secure is used, the statuses will be updated later

      if (resultCode === constants.RESULTCODES.AUTHORISED) {
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        order.setExportStatus(Order.EXPORT_STATUS_READY);
        Logger.getLogger('Adyen').info('Payment result: Authorised');
      }
    } else if (presentToShopperResultCodes.indexOf(resultCode) !== -1) {
      paymentResponse.decision = 'ACCEPT';

      if (responseObject.action) {
        paymentInstrument.custom.adyenAction = JSON.stringify(responseObject.action);
      }
    } else {
      paymentResponse.decision = 'REFUSED';
      order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
      order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
      errorMessage = refusedResultCodes.indexOf(resultCode) !== -1 ? Resource.msg('confirm.error.declined', 'checkout', null) : Resource.msg('confirm.error.unknown', 'checkout', null);

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

function doPaymentsDetailsCall(paymentDetailsRequest) {
  var callResult = executeCall(constants.SERVICE.PAYMENTDETAILS, paymentDetailsRequest);

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

  var apiKey = AdyenConfigs.getAdyenApiKey();
  service.addHeader('Content-type', 'application/json');
  service.addHeader('charset', 'UTF-8');
  service.addHeader('X-API-KEY', apiKey);
  var callResult = service.call(JSON.stringify(requestObject));
  return callResult;
}

module.exports = {
  createPaymentRequest: createPaymentRequest,
  doPaymentsCall: doPaymentsCall,
  doPaymentsDetailsCall: doPaymentsDetailsCall
};