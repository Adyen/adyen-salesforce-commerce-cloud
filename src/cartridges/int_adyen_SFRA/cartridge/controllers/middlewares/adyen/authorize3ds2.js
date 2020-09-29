const Logger = require('dw/system/Logger');
const URLUtils = require('dw/web/URLUtils');
const createAuthorization = require('./authorize3ds2/auth');

function authorize3ds2(req, res, next) {
  const options = { req, res, next };
  if (session.privacy.orderNo && session.privacy.paymentMethod) {
    try {
      return createAuthorization(session, options);
    } catch (e) {
      Logger.getLogger('Adyen').error(
        'Unable to retrieve order data from session 3DS2.',
      );
      res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
      return next();
    }
  }

  Logger.getLogger('Adyen').error('Session variables for 3DS2 do not exists');
  res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  return next();
}

module.exports = authorize3ds2;
