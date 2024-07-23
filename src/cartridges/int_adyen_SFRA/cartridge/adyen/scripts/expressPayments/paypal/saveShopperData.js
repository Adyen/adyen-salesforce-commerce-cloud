const URLUtils = require('dw/web/URLUtils');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function saveShopperData(req, res, next) {
  try {
    const shopperDetails = JSON.parse(req.form.shopperDetails);
    session.privacy.shopperDetails = JSON.stringify(shopperDetails);
    res.json({ success: true });
    return next();
  } catch (error) {
    AdyenLogs.error_log('Failed to save the shopper details:', error);
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = saveShopperData;
