"use strict";

var URLUtils = require('dw/web/URLUtils');
var OrderMgr = require('dw/order/OrderMgr');
var Order = require('dw/order/Order');
var Transaction = require('dw/system/Transaction');
var adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
var constants = require('*/cartridge/adyen/config/constants');
var payment = require('*/cartridge/adyen/scripts/showConfirmation/handlePayment');
var clearForms = require('*/cartridge/adyen/utils/clearForms');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
function getPaymentDetailsPayload(querystring) {
  var details = querystring.redirectResult ? {
    redirectResult: querystring.redirectResult
  } : {
    payload: querystring.payload
  };
  return {
    details: details
  };
}
function getPaymentsDetailsResult(adyenPaymentInstrument, redirectResult, payload, req) {
  var hasQuerystringDetails = !!(redirectResult || payload);
  // Saved response from Adyen-PaymentsDetails
  var result = JSON.parse(adyenPaymentInstrument.paymentTransaction.custom.Adyen_authResult);
  if (hasQuerystringDetails) {
    var requestObject = getPaymentDetailsPayload(req.querystring);
    result = adyenCheckout.doPaymentsDetailsCall(requestObject);
  }
  clearForms.clearPaymentTransactionData(adyenPaymentInstrument);
  return result;
}
function handleOrderConfirm(adyenPaymentInstrument, result, order, _ref) {
  var res = _ref.res,
    next = _ref.next;
  Transaction.wrap(function () {
    AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
  });
  clearForms.clearForms();
  // determines SFRA version for backwards compatibility
  if (AdyenConfigs.getAdyenSFRA6Compatibility() === true) {
    res.render('orderConfirmForm', {
      orderID: order.orderNo,
      orderToken: order.orderToken
    });
  } else {
    res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
  }
  return next();
}
function handlePaymentsDetailsResult(adyenPaymentInstrument, detailsResult, order, options) {
  if ([constants.RESULTCODES.AUTHORISED, constants.RESULTCODES.PENDING, constants.RESULTCODES.RECEIVED].indexOf(detailsResult.resultCode) > -1) {
    return handleOrderConfirm(adyenPaymentInstrument, detailsResult, order, options);
  }
  Transaction.wrap(function () {
    order.custom.Adyen_pspReference = detailsResult.pspReference;
    order.custom.Adyen_eventCode = detailsResult.resultCode;
  });
  return payment.handlePaymentError(order, 'placeOrder', options);
}
function isOrderAlreadyProcessed(order) {
  return order.status.value !== Order.ORDER_STATUS_CREATED && order.status.value !== Order.ORDER_STATUS_FAILED;
}

/*
 * Makes a payment details call to Adyen and calls for the order confirmation to be shown
 * if the payment was accepted.
 */
function showConfirmation(req, res, next) {
  var options = {
    req: req,
    res: res,
    next: next
  };
  var _req$querystring = req.querystring,
    redirectResult = _req$querystring.redirectResult,
    payload = _req$querystring.payload,
    signature = _req$querystring.signature,
    merchantReference = _req$querystring.merchantReference,
    orderToken = _req$querystring.orderToken;
  try {
    var order = OrderMgr.getOrder(merchantReference, orderToken);
    var adyenPaymentInstrument = order.getPaymentInstruments(AdyenHelper.getOrderMainPaymentInstrumentType(order))[0];
    if (isOrderAlreadyProcessed(order)) {
      AdyenLogs.info_log('ShowConfirmation called for an order which has already been processed. This is likely to be caused by shoppers using the back button after order confirmation');
      res.render('orderConfirmForm', {
        orderID: order.orderNo,
        orderToken: order.orderToken
      });
      return next();
    }
    if (adyenPaymentInstrument.paymentTransaction.custom.Adyen_merchantSig === signature) {
      if (order.status.value === Order.ORDER_STATUS_FAILED) {
        AdyenLogs.error_log("Could not call payment/details for failed order ".concat(order.orderNo));
        return payment.handlePaymentError(order, 'placeOrder', options);
      }
      clearForms.clearAdyenData(adyenPaymentInstrument);
      var detailsResult = getPaymentsDetailsResult(adyenPaymentInstrument, redirectResult, payload, req);
      return handlePaymentsDetailsResult(adyenPaymentInstrument, detailsResult, order, options);
    }
    throw new Error("Incorrect signature for order ".concat(merchantReference));
  } catch (error) {
    AdyenLogs.error_log('Could not verify /payment/details', error);
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}
module.exports = showConfirmation;