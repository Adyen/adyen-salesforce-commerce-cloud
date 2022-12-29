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
const StringUtils = require('dw/util/StringUtils');
const Transaction = require('dw/system/Transaction');
const Order = require('dw/order/Order');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const constants = require('*/cartridge/adyenConstants/constants');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

function getTerminals() {
  try {
    const requestObject = {};
    const getTerminalRequest = {};
    getTerminalRequest.merchantAccount = AdyenConfigs.getAdyenMerchantAccount();

    // storeId is optional
    if (AdyenConfigs.getAdyenStoreId() !== null) {
      getTerminalRequest.store = AdyenConfigs.getAdyenStoreId();
    }

    requestObject.request = getTerminalRequest;
    return executeCall(constants.SERVICE.CONNECTEDTERMINALS, requestObject);
  } catch (e) {
    AdyenLogs.fatal_log(
      `Adyen getTerminals: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
    );
    return { error: true, response: '{}' };
  }
}

function createTerminalPayment(order, paymentInstrument, terminalId) {
  try {
    Transaction.begin();
    const terminalRequestObject = {};
    if (!order || !paymentInstrument) {
      throw new Error(
        `Could not retrieve payment data, order = ${JSON.stringify(
          order,
        )}, paymentInstrument = ${JSON.stringify(paymentInstrument)}`,
      );
    }

    const { amount } = paymentInstrument.paymentTransaction;

    // serviceId should be a unique string
    const date = new Date();
    const dateString = date.getTime().toString();
    const serviceId = dateString.substr(dateString.length - 10);

    const applicationInfoObject = {};
    applicationInfoObject.applicationInfo = AdyenHelper.getApplicationInfo();
    const applicationInfoBase64 = StringUtils.encodeBase64(
      JSON.stringify(applicationInfoObject),
    );

    terminalRequestObject.request = {
      SaleToPOIRequest: {
        MessageHeader: {
          ProtocolVersion: '3.0',
          MessageClass: 'Service',
          MessageCategory: 'Payment',
          MessageType: 'Request',
          ServiceID: serviceId,
          SaleID: 'SalesforceCommerceCloud',
          POIID: terminalId,
        },
        PaymentRequest: {
          SaleData: {
            SaleTransactionID: {
              TransactionID: order.getOrderNo(),
              TimeStamp: new Date(),
            },
            SaleReferenceID: 'SalesforceCommerceCloudPOS',
            SaleToAcquirerData: applicationInfoBase64,
          },
          PaymentTransaction: {
            AmountsReq: {
              Currency: amount.currencyCode,
              RequestedAmount: amount.value,
            },
          },
        },
      },
    };

    terminalRequestObject.isPaymentRequest = true;
    terminalRequestObject.serviceId = serviceId;
    terminalRequestObject.terminalId = terminalId;

    const paymentResult = executeCall(
      constants.SERVICE.POSPAYMENT,
      terminalRequestObject,
    );
    if (paymentResult.error) {
      throw new Error(
        `Error in POS payment result: ${JSON.stringify(
          paymentResult.response,
        )}`,
      );
    } else {
      const terminalResponse = JSON.parse(paymentResult.response);
      let paymentResponse = '';
      if (terminalResponse.SaleToPOIResponse) {
        paymentResponse = terminalResponse.SaleToPOIResponse.PaymentResponse;
        if (paymentResponse.Response.Result === 'Success') {
          order.custom.Adyen_eventCode = 'AUTHORISATION';
          let pspReference = '';
          if (
            !empty(
              paymentResponse.PaymentResult.PaymentAcquirerData
                .AcquirerTransactionID.TransactionID,
            )
          ) {
            pspReference =
              paymentResponse.PaymentResult.PaymentAcquirerData
                .AcquirerTransactionID.TransactionID;
          } else if (
            !empty(paymentResponse.POIData.POITransactionID.TransactionID)
          ) {
            pspReference = paymentResponse.POIData.POITransactionID.TransactionID.split(
              '.',
            )[1];
          }
          // Save full response to transaction custom attribute
          paymentInstrument.paymentTransaction.transactionID = pspReference;
          order.custom.Adyen_pspReference = pspReference;
          order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
          order.setExportStatus(Order.EXPORT_STATUS_READY);
          paymentInstrument.paymentTransaction.custom.Adyen_log = JSON.stringify(
            paymentResponse,
          );
          Transaction.commit();
          return { error: false, authorized: true };
        }
      }

      throw new Error(
        `No correct response: ${JSON.stringify(paymentResponse.Response)}`,
      );
    }
  } catch (e) {
    Transaction.rollback();
    return { error: true, response: e.toString() };
  }
}

function sendAbortRequest(serviceId, terminalId) {
  const abortRequestObject = {};
  const newDate = new Date();
  const newDateString = newDate.getTime().toString();
  const newServiceId = newDateString.substr(newDateString.length - 10);
  abortRequestObject.request = {
    SaleToPOIRequest: {
      AbortRequest: {
        AbortReason: 'MerchantAbort',
        MessageReference: {
          SaleID: 'SalesforceCommerceCloud',
          ServiceID: serviceId,
          MessageCategory: 'Payment',
        },
      },
      MessageHeader: {
        MessageType: 'Request',
        MessageCategory: 'Abort',
        MessageClass: 'Service',
        ServiceID: newServiceId,
        SaleID: 'SalesforceCommerceCloud',
        POIID: terminalId,
        ProtocolVersion: '3.0',
      },
    },
  };
  return executeCall(constants.SERVICE.POSPAYMENT, abortRequestObject);
}

function executeCall(serviceType, requestObject) {
  const service = AdyenHelper.getService(serviceType);
  if (!service) {
    throw new Error(`Error creating terminal service ${serviceType}`);
  }

  const apiKey = AdyenConfigs.getAdyenApiKey();
  service.addHeader('Content-type', 'application/json');
  service.addHeader('charset', 'UTF-8');
  service.addHeader('X-API-KEY', apiKey);
  const callResult = service.call(JSON.stringify(requestObject.request));

  if (callResult.isOk() === false) {
    if (requestObject.isPaymentRequest) {
      const abortResult = sendAbortRequest(
        requestObject.serviceId,
        requestObject.terminalId,
      ).response;
      return { error: true, response: `Request aborted: ${abortResult}` };
    }
    throw new Error(
      `Call error code${callResult
        .getError()
        .toString()} Error => ResponseStatus: ${callResult.getStatus()} | ResponseErrorText: ${callResult.getErrorMessage()} | ResponseText: ${callResult.getMsg()}`,
    );
  }

  const resultObject = callResult.object;
  if (!resultObject || !resultObject.getText()) {
    throw new Error(
      `No correct response from ${serviceType}, result: ${JSON.stringify(
        resultObject,
      )}`,
    );
  }

  return { error: false, response: resultObject.getText() };
}

module.exports = {
  getTerminals,
  createTerminalPayment,
};
