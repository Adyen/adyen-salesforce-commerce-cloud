const handleAuthorize = require('./authorizeWithForm/authorize');
const handleError = require('./authorizeWithForm/error');

function authorizeWithForm(req, res, next) {
  const handleErr = (msg) => handleError(msg, { res, next });
  if (session.privacy.orderNo && session.privacy.paymentMethod) {
    try {
      return handleAuthorize({ req, res, next });
    } catch (e) {
      console.log(e);
      const msg = `Error retrieving Payment Methods. Error message: ${
        e.message
      } more details: ${e.toString()} in ${e.fileName}:${e.lineNumber}`;
      return handleErr('Unable to retrieve order data from session.');
    }
  }
  return handleErr('Session variable does not exists');
}

module.exports = authorizeWithForm;
