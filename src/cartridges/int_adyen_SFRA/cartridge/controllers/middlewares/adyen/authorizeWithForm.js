const handleAuthorize = require('./authorizeWithForm/authorize');
const handleError = require('./authorizeWithForm/error');

/**
 * Continues a 3DS1 payment.
 * Makes /payments/details call to 3d verification system to complete authorization.
 */
function authorizeWithForm(req, res, next) {
  const handleErr = (msg) => handleError(msg, { res, next });
  try {
    return handleAuthorize({ req, res, next });
  } catch (e) {
    return handleErr(
      `Unable to retrieve order data from session. Message = ${e.message}`,
    );
  }
}

module.exports = authorizeWithForm;
