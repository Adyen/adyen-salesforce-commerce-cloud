"use strict";

var Logger = require('dw/system/Logger');

var URLUtils = require('dw/web/URLUtils');

var OrderMgr = require('dw/order/OrderMgr');

var Order = require('dw/order/Order');

var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

var constants = require('*/cartridge/adyenConstants/constants');

var payment = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/payment');

var _require = require('*/cartridge/controllers/utils/index'),
    clearForms = _require.clearForms;

var handleAuthorised = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/authorise');
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

    if (order.status.value === Order.ORDER_STATUS_FAILED) {
      Logger.getLogger('Adyen').error("Could not call payment/details for failed order ".concat(order.orderNo));
      return payment.handlePaymentError(order, 'placeOrder', options);
    }

    var result = adyenCheckout.doPaymentsDetailsCall(requestObject);
    clearForms.clearAdyenData(adyenPaymentInstrument);

    if (result.invalidRequest) {
      Logger.getLogger('Adyen').error('Invalid /payments/details call');
      return response.redirect(URLUtils.httpHome());
    } // Authorised: The payment authorisation was successfully completed.


    if ([constants.RESULTCODES.AUTHORISED, constants.RESULTCODES.PENDING, constants.RESULTCODES.RECEIVED].indexOf(result.resultCode) > -1) {
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