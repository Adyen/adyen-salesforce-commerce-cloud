"use strict";

var Logger = require('dw/system/Logger');

var URLUtils = require('dw/web/URLUtils');

var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
/*
 * Redirects to list of added cards on success. Otherwise redirects to add payment with error
 */


function redirect(req, res, next) {
  try {
    var _req$form, _req$form2;

    var jsonRequest = {
      details: {
        MD: (_req$form = req.form) === null || _req$form === void 0 ? void 0 : _req$form.MD,
        PaRes: (_req$form2 = req.form) === null || _req$form2 === void 0 ? void 0 : _req$form2.PaRes
      }
    };
    var result = adyenCheckout.doPaymentsDetailsCall(jsonRequest);

    if (result.resultCode === 'Authorised') {
      res.redirect(URLUtils.url('PaymentInstruments-List'));
    } else {
      res.redirect(URLUtils.url('PaymentInstruments-AddPayment', 'isAuthorised', 'false'));
    }

    return next();
  } catch (e) {
    Logger.getLogger('Adyen').error("Error during 3ds1 response verification: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = redirect;