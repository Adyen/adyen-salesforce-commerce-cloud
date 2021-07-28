"use strict";

var Logger = require('dw/system/Logger');

var URLUtils = require('dw/web/URLUtils');

var OrderMgr = require('dw/order/OrderMgr');

var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

var constants = require('*/cartridge/adyenConstants/constants');

var payment = require('./showConfirmation/payment');

var _require = require('../../utils/index'),
    clearForms = _require.clearForms;

var handleAuthorised = require('./showConfirmation/authorise');
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

  try {
    var order = OrderMgr.getOrder(req.querystring.merchantReference);
    var paymentInstruments = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);

    var _payment$handlePaymen = payment.handlePaymentInstruments(paymentInstruments, options),
        details = _payment$handlePaymen.details,
        paymentData = _payment$handlePaymen.paymentData,
        adyenPaymentInstrument = _payment$handlePaymen.adyenPaymentInstrument; // redirect to payment/details


    var requestObject = {
      details: details,
      paymentData: paymentData
    };
    var result = adyenCheckout.doPaymentDetailsCall(requestObject);
    clearForms.clearAdyenData(adyenPaymentInstrument);

    if (result.invalidRequest) {
      Logger.getLogger('Adyen').error('Invalid /payments/details call');
      return response.redirect(URLUtils.httpHome());
    } // Authorised: The payment authorisation was successfully completed.


    if (['Authorised', 'Pending', 'Received'].indexOf(result.resultCode) > -1) {
      var merchantRefOrder = OrderMgr.getOrder(result.merchantReference);
      return handleAuthorised(merchantRefOrder, result, adyenPaymentInstrument, options);
    }

    return payment.handlePaymentError(order, 'placeOrder', options);
  } catch (e) {
    Logger.getLogger('Adyen').error("Could not verify /payment/details: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = showConfirmation;