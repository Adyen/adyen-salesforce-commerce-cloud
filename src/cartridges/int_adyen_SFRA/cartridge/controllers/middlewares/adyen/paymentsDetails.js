const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const handlePaymentsDetails = require('./paymentsDetails/payment');

/*
 * Makes a payment details call to Adyen to confirm redirectResults and returns the resultCode
 */
function paymentsDetails(req, res, next) {
  try {
    const stateData = JSON.parse(req.body);
    const response = handlePaymentsDetails(stateData);
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

module.exports = paymentsDetails;
