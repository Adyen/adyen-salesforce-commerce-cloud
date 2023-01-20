const URLUtils = require('dw/web/URLUtils');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

/**
 *  Save shopper details that came from an Express component into the SFCC session
 */
function saveExpressShopperDetails(req, res, next) {
  try {
    AdyenLogs.error_log('inside save shopper details ');
    const request = JSON.parse(req.body);

    AdyenLogs.error_log('request ' + JSON.stringify(request));

    session.privacy.expressShopperDetails = request.shopperDetails;
    AdyenLogs.error_log('session.privacy.expressShopperDetails ' + JSON.stringify(session.privacy.expressShopperDetails));
    res.json(request.shopperDetails);
    return next();
  } catch (e) {
    AdyenLogs.error_log(
      `Could not save express method shopper details .. ${e.toString()}`,
    );
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = saveExpressShopperDetails;
