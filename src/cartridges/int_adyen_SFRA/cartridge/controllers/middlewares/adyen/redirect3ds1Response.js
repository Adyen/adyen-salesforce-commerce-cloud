const URLUtils = require('dw/web/URLUtils');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const constants = require('*/cartridge/adyenConstants/constants');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

/*
 * Redirects to list of added cards on success. Otherwise redirects to add payment with error
 */
function redirect(req, res, next) {
  try {
    const redirectResult = req.httpParameterMap.get('redirectResult')
      .stringValue;
    const jsonRequest = {
      details: {
        redirectResult,
      },
    };
    const result = adyenCheckout.doPaymentsDetailsCall(jsonRequest);

    if (result.resultCode === constants.RESULTCODES.AUTHORISED) {
      res.redirect(URLUtils.url('PaymentInstruments-List'));
    } else {
      res.redirect(
        URLUtils.url('PaymentInstruments-AddPayment', 'isAuthorised', 'false'),
      );
    }

    return next();
  } catch (e) {
    AdyenLogs.error_log(
      `Error during 3ds1 response verification: ${e.toString()} in ${
        e.fileName
      }:${e.lineNumber}`,
    );
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = redirect;
