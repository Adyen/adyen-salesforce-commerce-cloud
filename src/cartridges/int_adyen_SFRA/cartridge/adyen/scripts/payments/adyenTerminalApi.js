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

function pspReferenceFromResponse(paymentResponse) {
  return paymentResponse?.POIData?.POITransactionID?.TransactionID?.split(
    '.',
  )[1];
}

function parsePaymentReceipt(paymentResponse) {
  return paymentResponse?.PaymentReceipt[0]?.OutputContent?.OutputText?.reduce((receipt, item) => {
    const params = decodeURIComponent(item.Text).split('&').reduce((paramObj, text) => {
      const param= text.split('=');
      paramObj[param[0]?.trim()] = param[1]?.trim();
      return paramObj;
    }, {});
    if(params.hasOwnProperty('key')) {
      receipt[params['key']] = params['value'];
    }
    return receipt
  },{})
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
        const pspReference = pspReferenceFromResponse(paymentResponse);
        if (paymentResponse.Response.Result === 'Success') {
          const paymentReceipt = parsePaymentReceipt(paymentResponse);

          // Set attributes for OMS
          order.custom.Adyen_eventCode = 'AUTHORISATION';
          order.custom.Adyen_pspReference = pspReference;
          order.custom.Adyen_paymentMethod = paymentReceipt.paymentMethod;
          paymentInstrument.custom.adyenMainPaymentInstrument = paymentResponse?.PaymentResult?.PaymentInstrumentData?.PaymentInstrumentType;
          paymentInstrument.custom.adyenPaymentMethod = paymentReceipt.paymentMethod;
          paymentInstrument.custom.Adyen_Payment_Method_Variant = paymentReceipt.paymentMethodVariant;
          paymentInstrument.custom[`${constants.OMS_NAMESPACE}__Adyen_Payment_Method`] = paymentReceipt.paymentMethod;
          paymentInstrument.custom[`${constants.OMS_NAMESPACE}__Adyen_Payment_Method_Variant`] = paymentReceipt.paymentMethodVariant;
          paymentInstrument.paymentTransaction.transactionID = pspReference;
          paymentInstrument.paymentTransaction.custom.Adyen_pspReference = pspReference;
          paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod = paymentReceipt.paymentMethod;
          paymentInstrument.paymentTransaction.custom.authCode = 'AUTHORISATION';


          // Save full response to transaction custom attribute
          paymentInstrument.paymentTransaction.custom.Adyen_log =
            JSON.stringify(paymentResponse);

          // Set payment status and export status
          order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
          order.setConfirmationStatus(Order.CONFIRMATION_STATUS_CONFIRMED);
          order.setExportStatus(Order.EXPORT_STATUS_READY);
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
    AdyenLogs.error_log('POS payment failed:', e);
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
  if (AdyenConfigs.getAdyenEnvironment() === constants.MODE.LIVE && serviceType === constants.SERVICE.POSPAYMENT) {
	const regionEndpoint = AdyenHelper.getTerminalApiEnvironment();
	const serviceUrl = service.getURL().replace(`[ADYEN-REGION]`, regionEndpoint);
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
