"use strict";

var Logger = require('dw/system/Logger');

var URLUtils = require('dw/web/URLUtils');

var OrderMgr = require('dw/order/OrderMgr');

var Transaction = require('dw/system/Transaction');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

var constants = require('*/cartridge/adyenConstants/constants');

function getSignature(paymentsDetailsResponse) {
  var order = OrderMgr.getOrder(paymentsDetailsResponse.merchantReference);

  if (order) {
    var paymentInstruments = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);
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
    var request = JSON.parse(req.body);
    var isAmazonpay = request.paymentMethod === 'amazonpay';
    request.paymentMethod = undefined;
    var paymentsDetailsResponse = adyenCheckout.doPaymentsDetailsCall(request);
    var response = AdyenHelper.createAdyenCheckoutResponse(paymentsDetailsResponse); // Create signature to verify returnUrl

    var signature = getSignature(paymentsDetailsResponse);

    if (isAmazonpay) {
      response.fullResponse = {
        pspReference: paymentsDetailsResponse.pspReference,
        paymentMethod: paymentsDetailsResponse.additionalData.paymentMethod,
        resultCode: paymentsDetailsResponse.resultCode
      };
    }

    if (signature !== null) {
      response.redirectUrl = URLUtils.url('Adyen-ShowConfirmation', 'merchantReference', response.merchantReference, 'signature', signature).toString();
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