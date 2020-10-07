const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const createAuthorization = require('./authorize3ds2/auth');

function authorize3ds2(req, res, next) {
  Logger.getLogger('Adyen').error('Authorise3ds2');
  Logger.getLogger('Adyen').error(req.form.merchantReference);
  const options = { req, res, next };
  try {
    return createAuthorization(options);
  } catch (e) {
    Logger.getLogger('Adyen').error(
      `Unable to retrieve order data from session 3DS2. Message: ${e.message}`,
    );
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = authorize3ds2;
