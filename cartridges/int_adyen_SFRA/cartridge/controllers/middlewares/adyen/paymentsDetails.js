"use strict";

var URLUtils = require('dw/web/URLUtils');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
function getSignature(paymentsDetailsResponse, orderToken) {
  var order = OrderMgr.getOrder(paymentsDetailsResponse.merchantReference, orderToken);
  if (order) {
    var paymentInstruments = order.getPaymentInstruments(AdyenHelper.getOrderMainPaymentInstrumentType(order));
    var signature = AdyenHelper.createSignature(paymentInstruments[0], order.getUUID(), paymentsDetailsResponse.merchantReference);
    Transaction.wrap(function () {
      paymentInstruments[0].paymentTransaction.custom.Adyen_authResult = JSON.stringify(paymentsDetailsResponse);
    });
    return signature;
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
    var signature = getSignature(paymentsDetailsResponse, request.orderToken);
    if (isAmazonpay) {
      response.fullResponse = {
        pspReference: paymentsDetailsResponse.pspReference,
        paymentMethod: paymentsDetailsResponse.additionalData.paymentMethod,
        resultCode: paymentsDetailsResponse.resultCode
      };
    }
    if (signature !== null) {
      response.redirectUrl = URLUtils.url('Adyen-ShowConfirmation', 'merchantReference', response.merchantReference, 'signature', signature, 'orderToken', request.orderToken).toString();
    }
    res.json(response);
    return next();
  } catch (e) {
    AdyenLogs.error_log("Could not verify /payment/details: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}
module.exports = paymentsDetails;