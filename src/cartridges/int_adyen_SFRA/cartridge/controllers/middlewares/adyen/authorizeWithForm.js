const handleAuthorize = require('./authorizeWithForm/authorize');
const handleError = require('./authorizeWithForm/error');

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
