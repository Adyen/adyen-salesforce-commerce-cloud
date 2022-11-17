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
const Logger = require('dw/system/Logger');
const Resource = require('dw/web/Resource');
const Order = require('dw/order/Order');
const Transaction = require('dw/system/Transaction');
const StringUtils = require('dw/util/StringUtils');

/* Script Modules */
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
const RiskDataHelper = require('*/cartridge/scripts/util/riskDataHelper');
const AdyenGetOpenInvoiceData = require('*/cartridge/scripts/adyenGetOpenInvoiceData');
const adyenLevelTwoThreeData = require('*/cartridge/scripts/adyenLevelTwoThreeData');
const constants = require('*/cartridge/adyenConstants/constants');

//SALE payment methods require payment transaction type to be Capture
function setPaymentTransactionType(paymentInstrument, paymentMethod) {
  const salePaymentMethods = AdyenConfigs.getAdyenSalePaymentMethods();
  if (salePaymentMethods.indexOf(paymentMethod.type) > -1) {
    Transaction.wrap(function () {
      paymentInstrument.getPaymentTransaction().setType(dw.order.PaymentTransaction.TYPE_CAPTURE);
    });
  }
}

function createPaymentRequest(args) {
  try {
    const order = args.Order;
    const paymentInstrument = args.PaymentInstrument;

    // Create request object with payment details
    let paymentRequest = AdyenHelper.createAdyenRequestObject(
      order,
      paymentInstrument,
    );

    // Add Risk data
    if (AdyenConfigs.getAdyenBasketFieldsEnabled()) {
      paymentRequest.additionalData = RiskDataHelper.createBasketContentFields(
        order,
      );
    }

    // Get 3DS2 data
    if (AdyenConfigs.getAdyen3DS2Enabled()) {
      paymentRequest = AdyenHelper.add3DS2Data(paymentRequest);
    }

    // L2/3 Data
    if (AdyenConfigs.getAdyenLevel23DataEnabled()) {
      paymentRequest.additionalData = { ...paymentRequest.additionalData, ...adyenLevelTwoThreeData.getLineItems(args) };
    }

    // Add installments
    if (AdyenConfigs.getCreditCardInstallments()) {
      const numOfInstallments = JSON.parse(paymentInstrument.custom.adyenPaymentData).installments?.value;
      if (numOfInstallments !== undefined) {
        paymentRequest.installments = {value: numOfInstallments};
      }
    }

    const value = AdyenHelper.getCurrencyValueForApi(
        paymentInstrument.paymentTransaction.amount,
    ).getValueOrNull();
    const currency = paymentInstrument.paymentTransaction.amount.currencyCode;
    // Add partial payments order if applicable
    if (paymentInstrument.custom.adyenPartialPaymentsOrder) {
      const adyenPartialPaymentsOrder = JSON.parse(paymentInstrument.custom.adyenPartialPaymentsOrder)
      if(value === adyenPartialPaymentsOrder.amount.value && currency === adyenPartialPaymentsOrder.amount.currency) {
        paymentRequest.order = adyenPartialPaymentsOrder.order;
        paymentRequest.amount = adyenPartialPaymentsOrder.remainingAmount;
      } else {
        throw new Error("Cart has been edited after applying a gift card");
      }
    } else {
      paymentRequest.amount = {
        currency,
        value,
      };
    }

    const paymentMethodType = paymentRequest.paymentMethod.type;
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

    if (session.privacy.adyenFingerprint) {
      paymentRequest.deviceFingerprint = session.privacy.adyenFingerprint;
    }
    // Set open invoice data
    if (AdyenHelper.isOpenInvoiceMethod(paymentRequest.paymentMethod.type)) {
      args.addTaxPercentage = true;
      if(paymentRequest.paymentMethod.type.indexOf('klarna') > -1){
        args.addTaxPercentage = false;
        const address = order.getBillingAddress();
        const shippingMethod = order.getDefaultShipment()?.shippingMethod;
        const otherDeliveryAddress = {
          shipping_method: shippingMethod?.displayName,
          shipping_type: shippingMethod?.description,
          first_name: address.firstName,
          last_name: address.lastName,
          street_address: `${address.address1} ${address.address2}`,
          postal_code: address.postalCode,
          city: address.city,
          country: address.countryCode.value,
        }
        // openinvoicedata.merchantData holds merchant data. It takes data in a Base64 encoded string.
        paymentRequest.additionalData['openinvoicedata.merchantData'] = StringUtils.encodeBase64(JSON.stringify(otherDeliveryAddress));
      }
      paymentRequest.lineItems = AdyenGetOpenInvoiceData.getLineItems(args);
      if (
        paymentRequest.paymentMethod.type.indexOf('ratepay') > -1 &&
        session.privacy.ratePayFingerprint
      ) {
        paymentRequest.deviceFingerprint = session.privacy.ratePayFingerprint;
      }
    }

    setPaymentTransactionType(paymentInstrument, paymentRequest.paymentMethod);

    // make API call
    return doPaymentsCall(order, paymentInstrument, paymentRequest);
  } catch (e) {
    Logger.getLogger('Adyen').error(
      `error processing payment. Error message: ${
        e.message
      } more details: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
    );
    return { error: true };
  }
}

function doPaymentsCall(order, paymentInstrument, paymentRequest) {
  const paymentResponse = {};
  let errorMessage = '';
  try {
    const responseObject = AdyenHelper.executeCall(constants.SERVICE.PAYMENT, paymentRequest);
    // There is no order for zero auth transactions.
    // Return response directly to PaymentInstruments-SavePayment
    if (!order) {
      return responseObject;
    }
    // set custom payment method field to sync with OMS. for card payments (scheme) we will store the brand
    order.custom.Adyen_paymentMethod = paymentRequest?.paymentMethod?.brand || paymentRequest?.paymentMethod?.type;
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
      paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod = responseObject.additionalData
        .paymentMethod
        ? responseObject.additionalData.paymentMethod
        : null;
    }

    const acceptedResultCodes = [
      constants.RESULTCODES.AUTHORISED,
      constants.RESULTCODES.PENDING,
      constants.RESULTCODES.RECEIVED,
      constants.RESULTCODES.REDIRECTSHOPPER
    ];

    const presentToShopperResultCodes = [constants.RESULTCODES.PRESENTTOSHOPPER];

    const refusedResultCodes = [
      constants.RESULTCODES.CANCELLED,
      constants.RESULTCODES.ERROR,
      constants.RESULTCODES.REFUSED
    ];

    const {resultCode} = paymentResponse;
    // Check the response object from /payment call
    if (acceptedResultCodes.indexOf(resultCode) !== -1) {
      paymentResponse.decision = 'ACCEPT';
      // if 3D Secure is used, the statuses will be updated later
      if (resultCode === constants.RESULTCODES.AUTHORISED) {
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        order.setExportStatus(Order.EXPORT_STATUS_READY);
        Logger.getLogger('Adyen').info('Payment result: Authorised');
      }
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
      errorMessage = refusedResultCodes.indexOf(resultCode) !== -1 ?
        Resource.msg('confirm.error.declined', 'checkout', null):
        Resource.msg('confirm.error.unknown', 'checkout', null);

      if (responseObject.refusalReason) {
        errorMessage += ` (${responseObject.refusalReason})`;
      }
      paymentResponse.adyenErrorMessage = errorMessage;
      Logger.getLogger('Adyen').info('Payment result: Refused');
    }
    return paymentResponse;
  } catch (e) {
    Logger.getLogger('Adyen').fatal(
      `Adyen: ${e.toString()} in ${e.fileName}:${e.lineNumber}`,
    );
    return {
      error: true,
      args: {adyenErrorMessage: Resource.msg(
        'confirm.error.declined',
        'checkout',
        null,
      )},
    };
  }
}

function doPaymentsDetailsCall(paymentDetailsRequest) {
  try {
    return AdyenHelper.executeCall(constants.SERVICE.PAYMENTDETAILS, paymentDetailsRequest);
  } catch (ex) {
    Logger.getLogger('Adyen').error(
      `error parsing response object ${ex.message}`,
    );
    return { error: true };
  }
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

module.exports = {
  createPaymentRequest,
  doPaymentsCall,
  doPaymentsDetailsCall,
  doCheckBalanceCall,
  doCancelPartialPaymentOrderCall,
  doCreatePartialPaymentOrderCall,
};
