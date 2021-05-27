const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const handlePayment = require('./confirmRedirectResult/payment');

/*
 * Makes a payment details call to Adyen to confirm redirectResults and returns the resultCode
 */
function confirmRedirectResult(req, res, next) {
  const options = { req, res, next };
  try {
    const stateData = req.querystring;
    const response = handlePayment(stateData, options);
    res.json(response);
    return next();
  } catch (e) {
    Logger.getLogger('Adyen').error(
      `Could not verify /payment/details: ${e.toString()} in ${e.fileName}:${
        e.lineNumber
      }`,
    );
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = confirmRedirectResult;
