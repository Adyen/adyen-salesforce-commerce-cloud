const Logger = require('dw/system/Logger');
const handlePaymentMethod = require('./getPaymentMethod/payment');

/**
 * Make a request to Adyen to get available payment methods
 */
function getPMs(req, res, next) {
  try {
    return handlePaymentMethod({ req, res, next });
  } catch (err) {
    const msg = `Error retrieving Payment Methods. Error message: ${
      err.message
    } more details: ${err.toString()} in ${err.fileName}:${err.lineNumber}`;
    Logger.getLogger('Adyen').error(msg);
    return next();
  }
}

module.exports = getPMs;
