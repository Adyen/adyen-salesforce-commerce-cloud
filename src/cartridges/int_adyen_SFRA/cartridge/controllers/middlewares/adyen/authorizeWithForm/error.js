const URLUtils = require('dw/web/URLUtils');
const Logger = require('dw/system/Logger');

function handleError(msg, { res, next }) {
  Logger.getLogger('Adyen').error(msg);
  res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  return next();
}

module.exports = handleError;
