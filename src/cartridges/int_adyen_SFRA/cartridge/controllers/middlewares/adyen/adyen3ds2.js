const URLUtils = require('dw/web/URLUtils');
const Logger = require('dw/system/Logger');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');

function adyen3ds2(req, res, next) {
  const protocol = req.https ? 'https' : 'http';

  try {
    const originKey = adyenGetOriginKey.getOriginKeyFromRequest(
      protocol,
      req.host,
    );
    const environment = AdyenHelper.getAdyenEnvironment().toLowerCase();
    const { resultCode } = req.querystring;
    const { token3ds2 } = req.querystring;
    res.render('/threeds2/adyen3ds2', {
      locale: request.getLocale(),
      originKey,
      environment,
      resultCode,
      token3ds2,
    });
  } catch (err) {
    Logger.getLogger('Adyen').error(
      `3DS2 redirect failed with reason: ${err.toString()}`,
    );
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
  }

  return next();
}

module.exports = adyen3ds2;
