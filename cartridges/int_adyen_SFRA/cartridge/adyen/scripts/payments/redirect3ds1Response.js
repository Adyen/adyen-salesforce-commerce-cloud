"use strict";

var URLUtils = require('dw/web/URLUtils');
var adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
var constants = require('*/cartridge/adyen/config/constants');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

/*
 * Redirects to list of added cards on success. Otherwise redirects to add payment with error
 */
function redirect(req, res, next) {
  try {
    var redirectResult = req.httpParameterMap.get('redirectResult').stringValue;
    var jsonRequest = {
      details: {
        redirectResult: redirectResult
      }
    };
    var result = adyenCheckout.doPaymentsDetailsCall(jsonRequest);
    if (result.resultCode === constants.RESULTCODES.AUTHORISED) {
      res.redirect(URLUtils.url('PaymentInstruments-List'));
    } else {
      res.redirect(URLUtils.url('PaymentInstruments-AddPayment', 'isAuthorised', 'false'));
    }
    return next();
  } catch (error) {
    AdyenLogs.error_log('Error during 3ds1 response verification:', error);
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}
module.exports = redirect;