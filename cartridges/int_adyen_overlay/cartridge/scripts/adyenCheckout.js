"use strict";

function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
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
var Resource = require('dw/web/Resource');
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');
var StringUtils = require('dw/util/StringUtils');

/* Script Modules */
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
var RiskDataHelper = require('*/cartridge/scripts/util/riskDataHelper');
var AdyenGetOpenInvoiceData = require('*/cartridge/scripts/adyenGetOpenInvoiceData');
var adyenLevelTwoThreeData = require('*/cartridge/scripts/adyenLevelTwoThreeData');
var constants = require('*/cartridge/adyenConstants/constants');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

//SALE payment methods require payment transaction type to be Capture
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
    var paymentInstrument = args.PaymentInstrument;

    // Create request object with payment details
    var paymentRequest = AdyenHelper.createAdyenRequestObject(order, paymentInstrument);
    paymentRequest = AdyenHelper.add3DS2Data(paymentRequest);

    // Add Risk data
    if (AdyenConfigs.getAdyenBasketFieldsEnabled()) {
      paymentRequest.additionalData = RiskDataHelper.createBasketContentFields(order);
    }

    // L2/3 Data
    if (AdyenConfigs.getAdyenLevel23DataEnabled()) {
      paymentRequest.additionalData = _objectSpread(_objectSpread({}, paymentRequest.additionalData), adyenLevelTwoThreeData.getLineItems(args));
    }

    // Add installments
    if (AdyenConfigs.getCreditCardInstallments()) {
      var _JSON$parse$installme;
      var numOfInstallments = (_JSON$parse$installme = JSON.parse(paymentInstrument.custom.adyenPaymentData).installments) === null || _JSON$parse$installme === void 0 ? void 0 : _JSON$parse$installme.value;
      if (numOfInstallments !== undefined) {
        paymentRequest.installments = {
          value: numOfInstallments
        };
      }
    }
    var value = AdyenHelper.getCurrencyValueForApi(paymentInstrument.paymentTransaction.amount).getValueOrNull();
    var currency = paymentInstrument.paymentTransaction.amount.currencyCode;
    // Add partial payments order if applicable
    if (paymentInstrument.custom.adyenPartialPaymentsOrder) {
      var adyenPartialPaymentsOrder = JSON.parse(paymentInstrument.custom.adyenPartialPaymentsOrder);
      if (value === adyenPartialPaymentsOrder.amount.value && currency === adyenPartialPaymentsOrder.amount.currency) {
        paymentRequest.order = adyenPartialPaymentsOrder.order;
        paymentRequest.amount = adyenPartialPaymentsOrder.remainingAmount;
      } else {
        throw new Error("Cart has been edited after applying a gift card");
      }
    } else {
      paymentRequest.amount = {
        currency: currency,
        value: value
      };
    }
    var paymentMethodType = paymentRequest.paymentMethod.type;
    // Create billing and delivery address objects for new orders,
    // no address fields for credit cards through My Account
    paymentRequest = AdyenHelper.createAddressObjects(order, paymentMethodType, paymentRequest);
    // Create shopper data fields
    paymentRequest = AdyenHelper.createShopperObject({
      order: order,
      paymentRequest: paymentRequest
    });
    if (session.privacy.adyenFingerprint) {
      paymentRequest.deviceFingerprint = session.privacy.adyenFingerprint;
    }
    // Set open invoice data
    if (AdyenHelper.isOpenInvoiceMethod(paymentRequest.paymentMethod.type)) {
      args.addTaxPercentage = true;
      if (paymentRequest.paymentMethod.type.indexOf('klarna') > -1) {
        var _order$getDefaultShip;
        args.addTaxPercentage = false;
        var address = order.getBillingAddress();
        var shippingMethod = (_order$getDefaultShip = order.getDefaultShipment()) === null || _order$getDefaultShip === void 0 ? void 0 : _order$getDefaultShip.shippingMethod;
        var otherDeliveryAddress = {
          shipping_method: shippingMethod === null || shippingMethod === void 0 ? void 0 : shippingMethod.displayName,
          shipping_type: shippingMethod === null || shippingMethod === void 0 ? void 0 : shippingMethod.description,
          first_name: address.firstName,
          last_name: address.lastName,
          street_address: "".concat(address.address1, " ").concat(address.address2),
          postal_code: address.postalCode,
          city: address.city,
          country: address.countryCode.value
        };
        // openinvoicedata.merchantData holds merchant data. It takes data in a Base64 encoded string.
        paymentRequest.additionalData['openinvoicedata.merchantData'] = StringUtils.encodeBase64(JSON.stringify(otherDeliveryAddress));
      }
      paymentRequest.lineItems = AdyenGetOpenInvoiceData.getLineItems(args);
      if (paymentRequest.paymentMethod.type.indexOf('ratepay') > -1 && session.privacy.ratePayFingerprint) {
        paymentRequest.deviceFingerprint = session.privacy.ratePayFingerprint;
      }
    }

    //Set Apple Pay tokenisation
    if (AdyenConfigs.getAdyenApplePayTokenisationEnabled() && AdyenHelper.isApplePay(paymentRequest.paymentMethod.type)) {
      paymentRequest.storePaymentMethod = true;
    }
    setPaymentTransactionType(paymentInstrument, paymentRequest.paymentMethod);

    // make API call
    return doPaymentsCall(order, paymentInstrument, paymentRequest);
  } catch (e) {
    AdyenLogs.error_log("error processing payment. Error message: ".concat(e.message, " more details: ").concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    return {
      error: true
    };
  }
}
function doPaymentsCall(order, paymentInstrument, paymentRequest) {
  var paymentResponse = {};
  var errorMessage = '';
  try {
    var _paymentRequest$payme, _paymentRequest$payme2;
    var responseObject = AdyenHelper.executeCall(constants.SERVICE.PAYMENT, paymentRequest);
    // There is no order for zero auth transactions.
    // Return response directly to PaymentInstruments-SavePayment
    if (!order) {
      return responseObject;
    }
    // set custom payment method field to sync with OMS. for card payments (scheme) we will store the brand
    order.custom.Adyen_paymentMethod = (paymentRequest === null || paymentRequest === void 0 ? void 0 : (_paymentRequest$payme = paymentRequest.paymentMethod) === null || _paymentRequest$payme === void 0 ? void 0 : _paymentRequest$payme.brand) || (paymentRequest === null || paymentRequest === void 0 ? void 0 : (_paymentRequest$payme2 = paymentRequest.paymentMethod) === null || _paymentRequest$payme2 === void 0 ? void 0 : _paymentRequest$payme2.type);
    paymentResponse.fullResponse = responseObject;
    paymentResponse.redirectObject = responseObject.action ? responseObject.action : '';
    paymentResponse.resultCode = responseObject.resultCode;
    paymentResponse.pspReference = responseObject.pspReference ? responseObject.pspReference : '';
    paymentResponse.adyenAmount = paymentRequest.amount.value;
    paymentResponse.decision = 'ERROR';
    if (responseObject.additionalData) {
      paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod = responseObject.additionalData.paymentMethod ? responseObject.additionalData.paymentMethod : null;
    }
    var acceptedResultCodes = [constants.RESULTCODES.AUTHORISED, constants.RESULTCODES.PENDING, constants.RESULTCODES.RECEIVED, constants.RESULTCODES.REDIRECTSHOPPER];
    var presentToShopperResultCodes = [constants.RESULTCODES.PRESENTTOSHOPPER];
    var refusedResultCodes = [constants.RESULTCODES.CANCELLED, constants.RESULTCODES.ERROR, constants.RESULTCODES.REFUSED];
    var resultCode = paymentResponse.resultCode;
    // Check the response object from /payment call
    if (acceptedResultCodes.indexOf(resultCode) !== -1) {
      paymentResponse.decision = 'ACCEPT';
      // if 3D Secure is used, the statuses will be updated later
      if (resultCode === constants.RESULTCODES.AUTHORISED) {
        order.setPaymentStatus(Order.PAYMENT_STATUS_PAID);
        order.setExportStatus(Order.EXPORT_STATUS_READY);
        AdyenLogs.info_log('Payment result: Authorised');
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
      AdyenLogs.info_log('Payment result: Refused');
    }
    return paymentResponse;
  } catch (e) {
    AdyenLogs.fatal_log("Adyen: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    return {
      error: true,
      args: {
        adyenErrorMessage: Resource.msg('confirm.error.declined', 'checkout', null)
      }
    };
  }
}
function doPaymentsDetailsCall(paymentDetailsRequest) {
  try {
    return AdyenHelper.executeCall(constants.SERVICE.PAYMENTDETAILS, paymentDetailsRequest);
  } catch (ex) {
    AdyenLogs.error_log("error parsing response object ".concat(ex.message));
    return {
      error: true
    };
  }
}
function doCheckBalanceCall(checkBalanceRequest) {
  return AdyenHelper.executeCall(constants.SERVICE.CHECKBALANCE, checkBalanceRequest);
}
function doCancelPartialPaymentOrderCall(cancelOrderRequest) {
  return AdyenHelper.executeCall(constants.SERVICE.CANCELPARTIALPAYMENTORDER, cancelOrderRequest);
}
function doCreatePartialPaymentOrderCall(partialPaymentRequest) {
  return AdyenHelper.executeCall(constants.SERVICE.PARTIALPAYMENTSORDER, partialPaymentRequest);
}
module.exports = {
  createPaymentRequest: createPaymentRequest,
  doPaymentsCall: doPaymentsCall,
  doPaymentsDetailsCall: doPaymentsDetailsCall,
  doCheckBalanceCall: doCheckBalanceCall,
  doCancelPartialPaymentOrderCall: doCancelPartialPaymentOrderCall,
  doCreatePartialPaymentOrderCall: doCreatePartialPaymentOrderCall
};