"use strict";

var Logger = require('dw/system/Logger');

var URLUtils = require('dw/web/URLUtils');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
/*
 * Makes a payment details call to Adyen to confirm the current status of a payment
 * This is used to confirm 3DS2 payment status after (zeroAuth) challenge & authentication
 */


function paymentsDetails(req, res, next) {
  try {
    var request = JSON.parse(req.body);
    var isAmazonpay = request.paymentMethod === 'amazonpay';
    request.paymentMethod = undefined;
    var paymentsDetailsResponse = adyenCheckout.doPaymentsDetailsCall(request);
    var response = AdyenHelper.createAdyenCheckoutResponse(paymentsDetailsResponse);

    if (isAmazonpay) {
      response.fullResponse = {
        pspReference: paymentsDetailsResponse.pspReference,
        paymentMethod: paymentsDetailsResponse.additionalData.paymentMethod,
        resultCode: paymentsDetailsResponse.resultCode
      };
    }

    res.json(response);
    return next();
  } catch (e) {
    Logger.getLogger('Adyen').error("Could not verify /payment/details: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = paymentsDetails;