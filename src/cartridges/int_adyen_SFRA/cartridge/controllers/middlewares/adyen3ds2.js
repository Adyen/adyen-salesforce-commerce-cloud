import * as URLUtils from 'dw/web/URLUtils';
import * as Logger from 'dw/system/Logger';
import * as AdyenHelper from '*/cartridge/scripts/util/adyenHelper';

function adyen3ds2(req, res, next) {
  const protocol = req.https ? 'https' : 'http';
  const adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');

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

export default adyen3ds2;
