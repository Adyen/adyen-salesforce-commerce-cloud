"use strict";

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
 * Send request to adyen to get connected terminals based on merchant account and storeId
 * Make a terminal payment for given order, payment instrument and terminal(id)
 */

// script include
var StringUtils = require('dw/util/StringUtils');
var Transaction = require('dw/system/Transaction');
var Order = require('dw/order/Order');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var constants = require('*/cartridge/adyen/config/constants');
function parsePaymentResponse(paymentResult) {
  var terminalResponse = JSON.parse(paymentResult.response);
  var _terminalResponse$Sal = terminalResponse.SaleToPOIResponse.PaymentResponse,
    TransactionID = _terminalResponse$Sal.POIData.POITransactionID.TransactionID,
    PaymentInstrumentType = _terminalResponse$Sal.PaymentResult.PaymentInstrumentData.PaymentInstrumentType,
    _terminalResponse$Sal2 = _terminalResponse$Sal.Response,
    AdditionalResponse = _terminalResponse$Sal2.AdditionalResponse,
    Result = _terminalResponse$Sal2.Result,
    ErrorCondition = _terminalResponse$Sal2.ErrorCondition;
  var pspReference = TransactionID.split('.').pop();
  var _JSON$parse = JSON.parse(StringUtils.decodeBase64(AdditionalResponse)),
    _JSON$parse$additiona = _JSON$parse.additionalData,
    paymentMethod = _JSON$parse$additiona.paymentMethod,
    paymentMethodVariant = _JSON$parse$additiona.paymentMethodVariant,
    message = _JSON$parse.message,
    refusalReason = _JSON$parse.refusalReason;
  return {
    pspReference: pspReference,
    paymentMethod: paymentMethod,
    paymentMethodVariant: paymentMethodVariant,
    paymentInstrumentType: PaymentInstrumentType,
    result: Result,
    error: {
      errorCondition: ErrorCondition,
      message: message,
      refusalReason: refusalReason
    }
  };
}
function createTerminalPayment(order, paymentInstrument, terminalId) {
  try {
    Transaction.begin();
    var terminalRequestObject = {};
    var result = {};
    if (!order || !paymentInstrument) {
      throw new Error("Could not retrieve payment data, order = ".concat(JSON.stringify(order), ", paymentInstrument = ").concat(JSON.stringify(paymentInstrument)));
    }
    var amount = paymentInstrument.paymentTransaction.amount;

    // serviceId should be a unique string
    var date = new Date();
    var dateString = date.getTime().toString();
    var serviceId = dateString.substr(dateString.length - 10);
    var applicationInfoObject = {};
    applicationInfoObject.applicationInfo = AdyenHelper.getApplicationInfo();
    var applicationInfoBase64 = StringUtils.encodeBase64(JSON.stringify(applicationInfoObject));
    terminalRequestObject.request = {
      SaleToPOIRequest: {
        MessageHeader: {
          ProtocolVersion: constants.POS_PROTOCOL_VERSION,
          MessageClass: constants.POS_MESSAGE_CLASS.SERVICE,
          MessageCategory: constants.POS_MESSAGE_CATEGORY.PAYMENT,
          MessageType: constants.POS_MESSAGE_TYPE.REQUEST,
          ServiceID: serviceId,
          SaleID: constants.EXTERNAL_PLATFORM_NAME,
          POIID: terminalId
        },
        PaymentRequest: {
          SaleData: {
            SaleTransactionID: {
              TransactionID: order.getOrderNo(),
              TimeStamp: new Date()
            },
            SaleReferenceID: constants.POS_REFERENCE_ID,
            SaleToAcquirerData: applicationInfoBase64
          },
          PaymentTransaction: {
            AmountsReq: {
              Currency: amount.currencyCode,
              RequestedAmount: amount.value
            }
          }
        }
      }
    };
    terminalRequestObject.isPaymentRequest = true;
    terminalRequestObject.serviceId = serviceId;
    terminalRequestObject.terminalId = terminalId;
    var paymentResult = executeCall(constants.SERVICE.POSPAYMENT, terminalRequestObject);
    if (paymentResult.error) {
      throw new Error("Error in POS payment result: ".concat(JSON.stringify(paymentResult.response)));
    } else {
      // Save full response to transaction custom attribute
      paymentInstrument.paymentTransaction.custom.Adyen_log = paymentResult.response;
      var paymentResponse = parsePaymentResponse(paymentResult);
      paymentInstrument.custom.adyenMainPaymentInstrument = paymentResponse.paymentInstrumentType;
      paymentInstrument.paymentTransaction.custom.authCode = paymentResponse.result;
      // Set attributes for OMS
      if (paymentResponse.pspReference) {
        order.custom.Adyen_pspReference = paymentResponse.pspReference;
        paymentInstrument.paymentTransaction.transactionID = paymentResponse.pspReference;
        paymentInstrument.paymentTransaction.custom.Adyen_pspReference = paymentResponse.pspReference;
      }
      if (paymentResponse.paymentMethod) {
        order.custom.Adyen_paymentMethod = paymentResponse.paymentMethod;
        paymentInstrument.custom.adyenPaymentMethod = paymentResponse.paymentMethod;
        paymentInstrument.custom["".concat(constants.OMS_NAMESPACE, "__Adyen_Payment_Method")] = paymentResponse.paymentMethod;
        paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod = paymentResponse.paymentMethod;
      }
      if (paymentResponse.paymentMethodVariant) {
        paymentInstrument.custom.Adyen_Payment_Method_Variant = paymentResponse.paymentMethodVariant;
        paymentInstrument.custom["".concat(constants.OMS_NAMESPACE, "__Adyen_Payment_Method_Variant")] = paymentResponse.paymentMethodVariant;
      }
      if (paymentResponse.result === constants.RESULTCODES.SUCCESS) {
        order.custom.Adyen_eventCode = constants.RESULTCODES.AUTHORISATION;
        result = {
          error: false,
          authorized: true
        };
      } else if (paymentResponse.result === constants.RESULTCODES.FAILURE) {
        order.custom.Adyen_eventCode = constants.RESULTCODES.FAILURE;
        order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
        result = {
          error: true,
          authorized: false
        };
        AdyenLogs.error_log('POS payment failed:', JSON.stringify(paymentResponse.error));
      }
      Transaction.commit();
      return result;
    }
  } catch (e) {
    AdyenLogs.error_log('POS payment failed:', e);
    Transaction.rollback();
    return {
      error: true,
      response: e.toString()
    };
  }
}
function sendAbortRequest(serviceId, terminalId) {
  var abortRequestObject = {};
  var newDate = new Date();
  var newDateString = newDate.getTime().toString();
  var newServiceId = newDateString.substr(newDateString.length - 10);
  abortRequestObject.request = {
    SaleToPOIRequest: {
      AbortRequest: {
        AbortReason: constants.POS_ABORT_REASON.MERCHANT_ABORT,
        MessageReference: {
          SaleID: constants.EXTERNAL_PLATFORM_NAME,
          ServiceID: serviceId,
          MessageCategory: constants.POS_MESSAGE_CATEGORY.PAYMENT
        }
      },
      MessageHeader: {
        MessageType: constants.POS_MESSAGE_TYPE.REQUEST,
        MessageCategory: constants.POS_MESSAGE_CATEGORY.ABORT,
        MessageClass: constants.POS_MESSAGE_CLASS.SERVICE,
        ServiceID: newServiceId,
        SaleID: constants.EXTERNAL_PLATFORM_NAME,
        POIID: terminalId,
        ProtocolVersion: constants.ProtocolVersion
      }
    }
  };
  return executeCall(constants.SERVICE.POSPAYMENT, abortRequestObject);
}
function executeCall(serviceType, requestObject) {
  var service = AdyenHelper.getService(serviceType);
  if (!service) {
    throw new Error("Error creating terminal service ".concat(serviceType));
  }
  var apiKey = AdyenConfigs.getAdyenApiKey();
  service.addHeader('Content-type', 'application/json');
  service.addHeader('charset', 'UTF-8');
  service.addHeader('X-API-KEY', apiKey);
  if (AdyenConfigs.getAdyenEnvironment() === constants.MODE.LIVE && serviceType === constants.SERVICE.POSPAYMENT) {
    var regionEndpoint = AdyenHelper.getTerminalApiEnvironment();
    var serviceUrl = service.getURL().replace('[ADYEN-REGION]', regionEndpoint);
    service.setURL(serviceUrl);
  }
  var callResult = service.call(JSON.stringify(requestObject.request));
  if (callResult.isOk() === false) {
    if (requestObject.isPaymentRequest) {
      var abortResult = sendAbortRequest(requestObject.serviceId, requestObject.terminalId).response;
      return {
        error: true,
        response: "Request aborted: ".concat(abortResult)
      };
    }
    throw new Error("Call error code".concat(callResult.getError().toString(), " Error => ResponseStatus: ").concat(callResult.getStatus(), " | ResponseErrorText: ").concat(callResult.getErrorMessage(), " | ResponseText: ").concat(callResult.getMsg()));
  }
  var resultObject = callResult.object;
  if (!resultObject || !resultObject.getText()) {
    throw new Error("No correct response from ".concat(serviceType, ", result: ").concat(JSON.stringify(resultObject)));
  }
  return {
    error: false,
    response: resultObject.getText()
  };
}
module.exports = {
  createTerminalPayment: createTerminalPayment,
  executeCall: executeCall
};