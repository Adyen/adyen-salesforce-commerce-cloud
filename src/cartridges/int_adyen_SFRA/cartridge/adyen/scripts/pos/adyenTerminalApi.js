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
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const constants = require('*/cartridge/adyen/config/constants');

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
          ProtocolVersion: constants.POS_PROTOCOL_VERSION,
          MessageClass: constants.POS_MESSAGE_CLASS.SERVICE,
          MessageCategory: constants.POS_MESSAGE_CATEGORY.PAYMENT,
          MessageType: constants.POS_MESSAGE_TYPE.REQUEST,
          ServiceID: serviceId,
          SaleID: constants.EXTERNAL_PLATFORM_NAME,
          POIID: terminalId,
        },
        PaymentRequest: {
          SaleData: {
            SaleTransactionID: {
              TransactionID: order.getOrderNo(),
              TimeStamp: new Date(),
            },
            SaleReferenceID: constants.POS_REFERENCE_ID,
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
        if (paymentResponse.Response.Result === constants.RESULTCODES.SUCCESS) {
          order.custom.Adyen_eventCode = constants.RESULTCODES.AUTHORISATION;
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
            pspReference =
              paymentResponse.POIData.POITransactionID.TransactionID.split(
                '.',
              )[1];
          }
          // Save full response to transaction custom attribute
          paymentInstrument.paymentTransaction.transactionID = pspReference;
          order.custom.Adyen_pspReference = pspReference;
          order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
          order.setExportStatus(Order.EXPORT_STATUS_READY);
          paymentInstrument.paymentTransaction.custom.Adyen_log =
            JSON.stringify(paymentResponse);
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
        AbortReason: constants.POS_ABORT_REASON.MERCHANT_ABORT,
        MessageReference: {
          SaleID: constants.EXTERNAL_PLATFORM_NAME,
          ServiceID: serviceId,
          MessageCategory: constants.POS_MESSAGE_CATEGORY.PAYMENT,
        },
      },
      MessageHeader: {
        MessageType: constants.POS_MESSAGE_TYPE.REQUEST,
        MessageCategory: constants.POS_MESSAGE_CATEGORY.ABORT,
        MessageClass: constants.POS_MESSAGE_CLASS.SERVICE,
        ServiceID: newServiceId,
        SaleID: constants.EXTERNAL_PLATFORM_NAME,
        POIID: terminalId,
        ProtocolVersion: constants.ProtocolVersion,
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
  if (
    AdyenConfigs.getAdyenEnvironment() === constants.MODE.LIVE &&
    serviceType === constants.SERVICE.POSPAYMENT
  ) {
    const regionEndpoint = AdyenHelper.getTerminalApiEnvironment();
    const serviceUrl = service
      .getURL()
      .replace('[ADYEN-REGION]', regionEndpoint);
    service.setURL(serviceUrl);
  }
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
  createTerminalPayment,
  executeCall,
};
