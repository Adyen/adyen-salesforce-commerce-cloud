"use strict";

var URLUtils = require('dw/web/URLUtils');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
function getRedirectUrl(paymentsDetailsResponse, orderToken) {
  var order = OrderMgr.getOrder(paymentsDetailsResponse.merchantReference, orderToken);
  if (order) {
    var paymentInstruments = order.getPaymentInstruments(AdyenHelper.getOrderMainPaymentInstrumentType(order));
    var redirectUrl = AdyenHelper.createRedirectUrl(paymentInstruments[0], paymentsDetailsResponse.merchantReference, orderToken);
    Transaction.wrap(function () {
      paymentInstruments[0].paymentTransaction.custom.Adyen_authResult = JSON.stringify(paymentsDetailsResponse);
    });
    return redirectUrl;
  }
  return undefined;
}

/*
 * Makes a payment details call to Adyen to confirm the current status of a payment
 */
function paymentsDetails(req, res, next) {
  try {
    var _request$data;
    var request = JSON.parse(req.body);
    var isAmazonpay = (request === null || request === void 0 ? void 0 : (_request$data = request.data) === null || _request$data === void 0 ? void 0 : _request$data.paymentMethod) === 'amazonpay';
    if (request.data) {
      request.data.paymentMethod = undefined;
    }
    var paymentsDetailsResponse = adyenCheckout.doPaymentsDetailsCall(request.data);
    var response = AdyenHelper.createAdyenCheckoutResponse(paymentsDetailsResponse);
    // Create signature to verify returnUrl
    var redirectUrl = getRedirectUrl(paymentsDetailsResponse, request.orderToken);
    if (isAmazonpay) {
      response.fullResponse = {
        pspReference: paymentsDetailsResponse.pspReference,
        paymentMethod: paymentsDetailsResponse.additionalData.paymentMethod,
        resultCode: paymentsDetailsResponse.resultCode
      };
    }
    if (redirectUrl) {
      response.redirectUrl = redirectUrl;
    }
    res.json(response);
    return next();
  } catch (error) {
    AdyenLogs.error_log('Could not verify /payment/details:', error);
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}
module.exports = paymentsDetails;