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
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var constants = require('*/cartridge/adyenConstants/constants');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
function getTerminals() {
  try {
    var requestObject = {};
    var getTerminalRequest = {};
    getTerminalRequest.merchantAccount = AdyenConfigs.getAdyenMerchantAccount();

    // storeId is optional
    if (AdyenConfigs.getAdyenStoreId() !== null) {
      getTerminalRequest.store = AdyenConfigs.getAdyenStoreId();
    }
    requestObject.request = getTerminalRequest;
    return executeCall(constants.SERVICE.CONNECTEDTERMINALS, requestObject);
  } catch (e) {
    AdyenLogs.fatal_log("Adyen getTerminals: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    return {
      error: true,
      response: '{}'
    };
  }
}
function createTerminalPayment(order, paymentInstrument, terminalId) {
  try {
    Transaction.begin();
    var terminalRequestObject = {};
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
          ProtocolVersion: '3.0',
          MessageClass: 'Service',
          MessageCategory: 'Payment',
          MessageType: 'Request',
          ServiceID: serviceId,
          SaleID: 'SalesforceCommerceCloud',
          POIID: terminalId
        },
        PaymentRequest: {
          SaleData: {
            SaleTransactionID: {
              TransactionID: order.getOrderNo(),
              TimeStamp: new Date()
            },
            SaleReferenceID: 'SalesforceCommerceCloudPOS',
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
      var terminalResponse = JSON.parse(paymentResult.response);
      var paymentResponse = '';
      if (terminalResponse.SaleToPOIResponse) {
        paymentResponse = terminalResponse.SaleToPOIResponse.PaymentResponse;
        if (paymentResponse.Response.Result === 'Success') {
          order.custom.Adyen_eventCode = 'AUTHORISATION';
          var pspReference = '';
          if (!empty(paymentResponse.PaymentResult.PaymentAcquirerData.AcquirerTransactionID.TransactionID)) {
            pspReference = paymentResponse.PaymentResult.PaymentAcquirerData.AcquirerTransactionID.TransactionID;
          } else if (!empty(paymentResponse.POIData.POITransactionID.TransactionID)) {
            pspReference = paymentResponse.POIData.POITransactionID.TransactionID.split('.')[1];
          }
          // Save full response to transaction custom attribute
          paymentInstrument.paymentTransaction.transactionID = pspReference;
          order.custom.Adyen_pspReference = pspReference;
          order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
          order.setExportStatus(Order.EXPORT_STATUS_READY);
          paymentInstrument.paymentTransaction.custom.Adyen_log = JSON.stringify(paymentResponse);
          Transaction.commit();
          return {
            error: false,
            authorized: true
          };
        }
      }
      throw new Error("No correct response: ".concat(JSON.stringify(paymentResponse.Response)));
    }
  } catch (e) {
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
        AbortReason: 'MerchantAbort',
        MessageReference: {
          SaleID: 'SalesforceCommerceCloud',
          ServiceID: serviceId,
          MessageCategory: 'Payment'
        }
      },
      MessageHeader: {
        MessageType: 'Request',
        MessageCategory: 'Abort',
        MessageClass: 'Service',
        ServiceID: newServiceId,
        SaleID: 'SalesforceCommerceCloud',
        POIID: terminalId,
        ProtocolVersion: '3.0'
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
  getTerminals: getTerminals,
  createTerminalPayment: createTerminalPayment
};