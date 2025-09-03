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
const Resource = require('dw/web/Resource');
const Order = require('dw/order/Order');
const StringUtils = require('dw/util/StringUtils');
const hooksHelper = require('*/cartridge/scripts/helpers/hooks');
/* Script Modules */
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
const RiskDataHelper = require('*/cartridge/adyen/utils/riskDataHelper');
const AdyenGetOpenInvoiceData = require('*/cartridge/adyen/scripts/payments/adyenGetOpenInvoiceData');
const adyenLevelTwoThreeData = require('*/cartridge/adyen/scripts/payments/adyenLevelTwoThreeData');
const constants = require('*/cartridge/adyen/config/constants');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const paypalHelper = require('*/cartridge/adyen/utils/paypalHelper');
const { AdyenError } = require('*/cartridge/adyen/logs/adyenError');
const preAuthorizationHook = require('*/cartridge/adyen/scripts/hooks/payment/preAuthorizationHandling');

// eslint-disable-next-line complexity
function doPaymentsCall(order, paymentInstrument, paymentRequest) {
  const paymentResponse = {};
  let errorMessage = '';
  if (!paymentRequest?.amount?.value) {
    throw new AdyenError('Zero amount not accepted');
  }
  const transactionAmount = AdyenHelper.getCurrencyValueForApi(
    paymentInstrument?.paymentTransaction?.amount,
  ).getValueOrNull();
  if (session.privacy.partialPaymentData) {
    const { remainingAmount } = JSON.parse(session.privacy.partialPaymentData);
    if (remainingAmount.value !== paymentRequest?.amount?.value) {
      throw new AdyenError('Amounts dont match');
    }
  } else if (transactionAmount !== paymentRequest?.amount?.value) {
    throw new AdyenError('Amounts dont match');
  }
  // Pre-auth hook
  const preAuthResult = hooksHelper(
    'app.payment.pre.auth',
    'preAuthorization',
    paymentRequest,
    preAuthorizationHook.preAuthorization,
  );
  if (preAuthResult?.error) {
    return preAuthResult;
  }
  const responseObject = AdyenHelper.executeCall(
    constants.SERVICE.PAYMENT,
    paymentRequest,
  );
  paymentResponse.fullResponse = responseObject;
  paymentResponse.redirectObject = responseObject.action
    ? responseObject.action
    : '';
  paymentResponse.resultCode = responseObject.resultCode;
  paymentResponse.pspReference = responseObject.pspReference
    ? responseObject.pspReference
    : '';
  paymentResponse.adyenAmount = paymentRequest.amount.value;
  paymentResponse.decision = 'ERROR';

  if (responseObject.additionalData) {
    paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod =
      responseObject.additionalData.paymentMethod
        ? responseObject.additionalData.paymentMethod
        : null;
  }

  const acceptedResultCodes = [
    constants.RESULTCODES.AUTHORISED,
    constants.RESULTCODES.PENDING,
    constants.RESULTCODES.RECEIVED,
    constants.RESULTCODES.REDIRECTSHOPPER,
  ];

  const presentToShopperResultCodes = [constants.RESULTCODES.PRESENTTOSHOPPER];

  const refusedResultCodes = [
    constants.RESULTCODES.CANCELLED,
    constants.RESULTCODES.ERROR,
    constants.RESULTCODES.REFUSED,
  ];

  const { resultCode } = paymentResponse;
  // Check the response object from /payment call
  if (acceptedResultCodes.indexOf(resultCode) !== -1) {
    paymentResponse.decision = 'ACCEPT';
  } else if (presentToShopperResultCodes.indexOf(resultCode) !== -1) {
    paymentResponse.decision = 'ACCEPT';
    if (responseObject.action) {
      paymentInstrument.custom.adyenAction = JSON.stringify(
        responseObject.action,
      );
    }
  } else {
    paymentResponse.decision = 'REFUSED';
    order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
    order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
    errorMessage =
      refusedResultCodes.indexOf(resultCode) !== -1
        ? Resource.msg('confirm.error.declined', 'checkout', null)
        : Resource.msg('confirm.error.unknown', 'checkout', null);

    if (responseObject.refusalReason) {
      errorMessage += ` (${responseObject.refusalReason})`;
    }
    paymentResponse.adyenErrorMessage = errorMessage;
    AdyenLogs.info_log('Payment result: Refused');
  }
  return paymentResponse;
}

// eslint-disable-next-line complexity
function createPaymentRequest(args) {
  const order = args.Order;
  const orderNumber = args.OrderNo;
  const orderToken = args.OrderToken;
  const { paymentInstrument } = order;

  // Create request object with payment details
  let paymentRequest = AdyenHelper.createAdyenRequestObject(
    orderNumber,
    orderToken,
    paymentInstrument,
    order.getCustomerEmail(),
  );
  // Set payment instrument fields
  AdyenHelper.setPaymentInstrumentFields(paymentInstrument, paymentRequest);

  const paymentMethodType = paymentRequest.paymentMethod.type;
  paymentRequest = AdyenHelper.add3DS2Data(paymentRequest);
  // Add Risk data
  if (AdyenConfigs.getAdyenBasketFieldsEnabled()) {
    paymentRequest.additionalData =
      RiskDataHelper.createBasketContentFields(order);
  }

  // L2/3 Data
  if (
    AdyenConfigs.getAdyenLevel23DataEnabled() &&
    paymentMethodType.indexOf('scheme') > -1
  ) {
    paymentRequest.additionalData = {
      ...paymentRequest.additionalData,
      ...adyenLevelTwoThreeData.getLineItems(args),
    };
  }

  // Add installments
  if (
    AdyenConfigs.getAdyenInstallmentsEnabled() &&
    AdyenConfigs.getCreditCardInstallments()
  ) {
    const numOfInstallments = JSON.parse(
      paymentInstrument.custom.adyenPaymentData,
    ).installments?.value;
    if (numOfInstallments !== undefined) {
      paymentRequest.installments = { value: numOfInstallments };
    }
  }
  const value = AdyenHelper.getCurrencyValueForApi(
    paymentInstrument.paymentTransaction.amount,
  ).getValueOrNull();
  const currency = paymentInstrument.paymentTransaction.amount.currencyCode;
  // Add partial payments order if applicable
  if (paymentInstrument.custom.adyenPartialPaymentsOrder) {
    const adyenPartialPaymentsOrder = JSON.parse(
      paymentInstrument.custom.adyenPartialPaymentsOrder,
    );
    if (
      value === adyenPartialPaymentsOrder.amount.value &&
      currency === adyenPartialPaymentsOrder.amount.currency
    ) {
      paymentRequest.order = adyenPartialPaymentsOrder.order;
      paymentRequest.amount = adyenPartialPaymentsOrder.remainingAmount;
    } else {
      throw new AdyenError('Cart has been edited after applying a gift card');
    }
  } else {
    paymentRequest.amount = {
      currency,
      value,
    };
  }

  // Create billing and delivery address objects for new orders,
  // no address fields for credit cards through My Account
  paymentRequest = AdyenHelper.createAddressObjects(
    order,
    paymentMethodType,
    paymentRequest,
  );

  // Create shopper data fields
  paymentRequest = AdyenHelper.createShopperObject({
    order,
    paymentRequest,
  });

  if (
    session.privacy.adyenFingerprint &&
    paymentMethodType.indexOf('riverty') === -1
  ) {
    paymentRequest.deviceFingerprint = session.privacy.adyenFingerprint;
  }
  // Set open invoice data
  if (AdyenHelper.isOpenInvoiceMethod(paymentRequest.paymentMethod.type)) {
    args.addTaxPercentage = true;
    if (paymentRequest.paymentMethod.type.indexOf('klarna') > -1) {
      args.addTaxPercentage = false;
      const address = order.getBillingAddress();
      const shippingMethod = order.getDefaultShipment()?.shippingMethod;
      const otherDeliveryAddress = {
        shipping_method: shippingMethod?.displayName,
        shipping_type: shippingMethod?.description,
        first_name: address.firstName,
        last_name: address.lastName,
        street_address: address.address1,
        street_number: address.address2,
        postal_code: address.postalCode,
        city: address.city,
        country: address.countryCode.value,
      };
      // openinvoicedata.merchantData holds merchant data.
      // It takes data in a Base64 encoded string.
      paymentRequest.additionalData['openinvoicedata.merchantData'] =
        StringUtils.encodeBase64(JSON.stringify(otherDeliveryAddress));
    }
    paymentRequest.lineItems = AdyenGetOpenInvoiceData.getLineItems(args);
    if (
      paymentMethodType.indexOf('ratepay') > -1 &&
      session.privacy.ratePayFingerprint
    ) {
      paymentRequest.deviceFingerprint = session.privacy.ratePayFingerprint;
    }
  }
  paymentRequest.shopperConversionId = session.sessionID.slice(0, 200);

  // add line items for paypal
  if (paymentRequest.paymentMethod.type.indexOf('paypal') > -1) {
    paymentRequest.lineItems = paypalHelper.getLineItems(args);
  }

  // riverty requires some additional parameters
  if (paymentRequest.paymentMethod.type.indexOf('riverty') > -1) {
    paymentRequest.paymentMethod.subtype = 'redirect';
    paymentRequest.shopperIP = request.getHttpRemoteAddress();
    paymentRequest.deviceFingerprint = session.sessionID;
  }

  // Set tokenisation
  if (AdyenConfigs.getAdyenTokenisationEnabled()) {
    paymentRequest.storePaymentMethod = true;
    paymentRequest.recurringProcessingModel =
      constants.RECURRING_PROCESSING_MODEL.CARD_ON_FILE;
  }
  AdyenHelper.setPaymentTransactionType(
    paymentInstrument,
    paymentRequest.paymentMethod,
  );
  try {
    return doPaymentsCall(order, paymentInstrument, paymentRequest);
  } catch (error) {
    AdyenLogs.error_log('Payment call failed:', error);
    return {
      error: true,
      adyenErrorMessage:
        error.message ||
        Resource.msg('confirm.error.declined', 'checkout', null),
    };
  }
}

function doPaymentsDetailsCall(paymentDetailsRequest) {
  return AdyenHelper.executeCall(
    constants.SERVICE.PAYMENTDETAILS,
    paymentDetailsRequest,
  );
}

function doCheckBalanceCall(checkBalanceRequest) {
  return AdyenHelper.executeCall(
    constants.SERVICE.CHECKBALANCE,
    checkBalanceRequest,
  );
}

function doCancelPartialPaymentOrderCall(cancelOrderRequest) {
  return AdyenHelper.executeCall(
    constants.SERVICE.CANCELPARTIALPAYMENTORDER,
    cancelOrderRequest,
  );
}

function doCreatePartialPaymentOrderCall(partialPaymentRequest) {
  return AdyenHelper.executeCall(
    constants.SERVICE.PARTIALPAYMENTSORDER,
    partialPaymentRequest,
  );
}

function doPaypalUpdateOrderCall(paypalUpdateOrderRequest) {
  return AdyenHelper.executeCall(
    constants.SERVICE.PAYPALUPDATEORDER,
    paypalUpdateOrderRequest,
  );
}

module.exports = {
  createPaymentRequest,
  doPaymentsCall,
  doPaymentsDetailsCall,
  doCheckBalanceCall,
  doCancelPartialPaymentOrderCall,
  doCreatePartialPaymentOrderCall,
  doPaypalUpdateOrderCall,
};
