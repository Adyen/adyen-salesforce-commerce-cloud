"use strict";

function _typeof(o) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (o) { return typeof o; } : function (o) { return o && "function" == typeof Symbol && o.constructor === Symbol && o !== Symbol.prototype ? "symbol" : typeof o; }, _typeof(o); }
function ownKeys(e, r) { var t = Object.keys(e); if (Object.getOwnPropertySymbols) { var o = Object.getOwnPropertySymbols(e); r && (o = o.filter(function (r) { return Object.getOwnPropertyDescriptor(e, r).enumerable; })), t.push.apply(t, o); } return t; }
function _objectSpread(e) { for (var r = 1; r < arguments.length; r++) { var t = null != arguments[r] ? arguments[r] : {}; r % 2 ? ownKeys(Object(t), !0).forEach(function (r) { _defineProperty(e, r, t[r]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(e, Object.getOwnPropertyDescriptors(t)) : ownKeys(Object(t)).forEach(function (r) { Object.defineProperty(e, r, Object.getOwnPropertyDescriptor(t, r)); }); } return e; }
function _defineProperty(e, r, t) { return (r = _toPropertyKey(r)) in e ? Object.defineProperty(e, r, { value: t, enumerable: !0, configurable: !0, writable: !0 }) : e[r] = t, e; }
function _toPropertyKey(t) { var i = _toPrimitive(t, "string"); return "symbol" == _typeof(i) ? i : i + ""; }
function _toPrimitive(t, r) { if ("object" != _typeof(t) || !t) return t; var e = t[Symbol.toPrimitive]; if (void 0 !== e) { var i = e.call(t, r || "default"); if ("object" != _typeof(i)) return i; throw new TypeError("@@toPrimitive must return a primitive value."); } return ("string" === r ? String : Number)(t); }
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
var StringUtils = require('dw/util/StringUtils');
/* Script Modules */
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
var RiskDataHelper = require('*/cartridge/adyen/utils/riskDataHelper');
var AdyenGetOpenInvoiceData = require('*/cartridge/adyen/scripts/payments/adyenGetOpenInvoiceData');
var adyenLevelTwoThreeData = require('*/cartridge/adyen/scripts/payments/adyenLevelTwoThreeData');
var constants = require('*/cartridge/adyen/config/constants');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var paypalHelper = require('*/cartridge/adyen/utils/paypalHelper');

// eslint-disable-next-line complexity
function doPaymentsCall(order, paymentInstrument, paymentRequest) {
  var paymentResponse = {};
  var errorMessage = '';
  try {
    var _paymentRequest$amoun, _paymentInstrument$pa, _paymentRequest$amoun3;
    if (!(paymentRequest !== null && paymentRequest !== void 0 && (_paymentRequest$amoun = paymentRequest.amount) !== null && _paymentRequest$amoun !== void 0 && _paymentRequest$amoun.value)) {
      throw new Error('Zero amount not accepted');
    }
    var transactionAmount = AdyenHelper.getCurrencyValueForApi(paymentInstrument === null || paymentInstrument === void 0 ? void 0 : (_paymentInstrument$pa = paymentInstrument.paymentTransaction) === null || _paymentInstrument$pa === void 0 ? void 0 : _paymentInstrument$pa.amount).getValueOrNull();
    if (session.privacy.partialPaymentData) {
      var _paymentRequest$amoun2;
      var _JSON$parse = JSON.parse(session.privacy.partialPaymentData),
        remainingAmount = _JSON$parse.remainingAmount;
      if (remainingAmount.value !== (paymentRequest === null || paymentRequest === void 0 ? void 0 : (_paymentRequest$amoun2 = paymentRequest.amount) === null || _paymentRequest$amoun2 === void 0 ? void 0 : _paymentRequest$amoun2.value)) {
        throw new Error('Amounts dont match');
      }
    } else if (transactionAmount !== (paymentRequest === null || paymentRequest === void 0 ? void 0 : (_paymentRequest$amoun3 = paymentRequest.amount) === null || _paymentRequest$amoun3 === void 0 ? void 0 : _paymentRequest$amoun3.value)) {
      throw new Error('Amounts dont match');
    }
    var responseObject = AdyenHelper.executeCall(constants.SERVICE.PAYMENT, paymentRequest);
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
  } catch (error) {
    AdyenLogs.fatal_log('Payments call failed:', error);
    return {
      error: true,
      args: {
        adyenErrorMessage: Resource.msg('confirm.error.declined', 'checkout', null)
      }
    };
  }
}

// eslint-disable-next-line complexity
function createPaymentRequest(args) {
  try {
    var order = args.Order;
    var paymentInstrument = order.paymentInstrument;

    // Create request object with payment details
    var paymentRequest = AdyenHelper.createAdyenRequestObject(order.getOrderNo(), order.getOrderToken(), paymentInstrument, order.getCustomerEmail());
    var paymentMethodType = paymentRequest.paymentMethod.type;
    paymentRequest = AdyenHelper.add3DS2Data(paymentRequest);
    // Add Risk data
    if (AdyenConfigs.getAdyenBasketFieldsEnabled()) {
      paymentRequest.additionalData = RiskDataHelper.createBasketContentFields(order);
    }

    // L2/3 Data
    if (AdyenConfigs.getAdyenLevel23DataEnabled() && paymentMethodType.indexOf('scheme') > -1) {
      paymentRequest.additionalData = _objectSpread(_objectSpread({}, paymentRequest.additionalData), adyenLevelTwoThreeData.getLineItems(args));
    }

    // Add installments
    if (AdyenConfigs.getAdyenInstallmentsEnabled() && AdyenConfigs.getCreditCardInstallments()) {
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
        throw new Error('Cart has been edited after applying a gift card');
      }
    } else {
      paymentRequest.amount = {
        currency: currency,
        value: value
      };
    }

    // Create billing and delivery address objects for new orders,
    // no address fields for credit cards through My Account
    paymentRequest = AdyenHelper.createAddressObjects(order, paymentMethodType, paymentRequest);

    // Create shopper data fields
    paymentRequest = AdyenHelper.createShopperObject({
      order: order,
      paymentRequest: paymentRequest
    });
    if (session.privacy.adyenFingerprint && paymentMethodType.indexOf('riverty') === -1) {
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
          street_address: address.address1,
          street_number: address.address2,
          postal_code: address.postalCode,
          city: address.city,
          country: address.countryCode.value
        };
        // openinvoicedata.merchantData holds merchant data.
        // It takes data in a Base64 encoded string.
        paymentRequest.additionalData['openinvoicedata.merchantData'] = StringUtils.encodeBase64(JSON.stringify(otherDeliveryAddress));
      }
      paymentRequest.lineItems = AdyenGetOpenInvoiceData.getLineItems(args);
      if (paymentMethodType.indexOf('ratepay') > -1 && session.privacy.ratePayFingerprint) {
        paymentRequest.deviceFingerprint = session.privacy.ratePayFingerprint;
      }
    }
    paymentRequest.shopperConversionId = session.sessionID.slice(0, 200);

    // add line items for paypal
    if (paymentRequest.paymentMethod.type.indexOf('paypal') > -1) {
      paymentRequest.lineItems = paypalHelper.getLineItems(args);
    }

    // Set tokenisation
    if (AdyenConfigs.getAdyenTokenisationEnabled()) {
      paymentRequest.storePaymentMethod = true;
      paymentRequest.recurringProcessingModel = constants.RECURRING_PROCESSING_MODEL.CARD_ON_FILE;
    }
    AdyenHelper.setPaymentTransactionType(paymentInstrument, paymentRequest.paymentMethod);
    return doPaymentsCall(order, paymentInstrument, paymentRequest);
  } catch (error) {
    AdyenLogs.error_log('Error processing payment:', error);
    return {
      error: true
    };
  }
}
function doPaymentsDetailsCall(paymentDetailsRequest) {
  try {
    return AdyenHelper.executeCall(constants.SERVICE.PAYMENTDETAILS, paymentDetailsRequest);
  } catch (error) {
    AdyenLogs.error_log('Error parsing response object:', error);
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
function doPaypalUpdateOrderCall(paypalUpdateOrderRequest) {
  return AdyenHelper.executeCall(constants.SERVICE.PAYPALUPDATEORDER, paypalUpdateOrderRequest);
}
module.exports = {
  createPaymentRequest: createPaymentRequest,
  doPaymentsCall: doPaymentsCall,
  doPaymentsDetailsCall: doPaymentsDetailsCall,
  doCheckBalanceCall: doCheckBalanceCall,
  doCancelPartialPaymentOrderCall: doCancelPartialPaymentOrderCall,
  doCreatePartialPaymentOrderCall: doCreatePartialPaymentOrderCall,
  doPaypalUpdateOrderCall: doPaypalUpdateOrderCall
};