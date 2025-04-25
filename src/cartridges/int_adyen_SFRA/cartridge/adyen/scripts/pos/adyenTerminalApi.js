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
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const constants = require('*/cartridge/adyen/config/constants');

function parsePaymentResponse(paymentResult) {
  const terminalResponse = JSON.parse(paymentResult.response);
  const {SaleToPOIResponse : {
    PaymentResponse : {
      POIData: {
        POITransactionID: {
          TransactionID
        }
      },
      PaymentResult: {
        PaymentInstrumentData: {
          PaymentInstrumentType
        }
      },
        Response: {
          AdditionalResponse,
          Result,
          ErrorCondition
        },
    }
  }} = terminalResponse;
  const pspReference = TransactionID.split('.').pop();
  const {additionalData : {
    paymentMethod,
    paymentMethodVariant
  },
    message,
    refusalReason
  } = JSON.parse(StringUtils.decodeBase64(AdditionalResponse));
  return {
    pspReference,
    paymentMethod,
    paymentMethodVariant,
    paymentInstrumentType: PaymentInstrumentType,
    result: Result,
    error: {
      errorCondition: ErrorCondition,
      message,
      refusalReason
    }
  }
}

function createTerminalPayment(order, paymentInstrument, terminalId) {
  try {
    Transaction.begin();
    const terminalRequestObject = {};
    let result = {};
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
      // Save full response to transaction custom attribute
      paymentInstrument.paymentTransaction.custom.Adyen_log = paymentResult.response

      const paymentResponse = parsePaymentResponse(paymentResult);
      paymentInstrument.custom.adyenMainPaymentInstrument = paymentResponse.paymentInstrumentType;
      paymentInstrument.paymentTransaction.custom.authCode = paymentResponse.result;
      // Set attributes for OMS
      if (paymentResponse.pspReference) {
        order.custom.Adyen_pspReference = paymentResponse.pspReference;
        paymentInstrument.paymentTransaction.transactionID = paymentResponse.pspReference;
        paymentInstrument.paymentTransaction.custom.Adyen_pspReference = paymentResponse.pspReference;
      }
      if(paymentResponse.paymentMethod) {
        order.custom.Adyen_paymentMethod = paymentResponse.paymentMethod;
        paymentInstrument.custom.adyenPaymentMethod = paymentResponse.paymentMethod;
        paymentInstrument.custom[`${constants.OMS_NAMESPACE}__Adyen_Payment_Method`] = paymentResponse.paymentMethod;
        paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod = paymentResponse.paymentMethod;
      }
      if(paymentResponse.paymentMethodVariant) {
        paymentInstrument.custom.Adyen_Payment_Method_Variant = paymentResponse.paymentMethodVariant;
        paymentInstrument.custom[`${constants.OMS_NAMESPACE}__Adyen_Payment_Method_Variant`] = paymentResponse.paymentMethodVariant;
      }
      if (paymentResponse.result === constants.RESULTCODES.SUCCESS) {
        order.custom.Adyen_eventCode = constants.RESULTCODES.AUTHORISATION;
        result = { error: false, authorized: true };
      } else if(paymentResponse.result === constants.RESULTCODES.FAILURE) {
        order.custom.Adyen_eventCode = constants.RESULTCODES.FAILURE;
        order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
        order.setConfirmationStatus(Order.CONFIRMATION_STATUS_NOTCONFIRMED);
        result = { error: true, authorized: false };
        AdyenLogs.error_log('POS payment failed:', JSON.stringify(paymentResponse.error));
      }
      Transaction.commit();
      return result;
    }
  } catch (e) {
    AdyenLogs.error_log('POS payment failed:', e);
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
