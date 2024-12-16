const URLUtils = require('dw/web/URLUtils');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const constants = require('*/cartridge/adyen/config/constants');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const setErrorType = require('*/cartridge/adyen/logs/setErrorType');
/*
 * Redirects to list of added cards on success. Otherwise redirects to add payment with error
 */
function redirect(req, res, next) {
  try {
    const redirectResult =
      req.httpParameterMap.get('redirectResult').stringValue;
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
  } catch (error) {
    AdyenLogs.error_log('Error during 3ds1 response verification:', error);
    setErrorType(error, res, {
      redirectUrl: URLUtils.url('Error-ErrorCode', 'err', 'general').toString(),
    });
  }
  return next();
}

module.exports = redirect;
