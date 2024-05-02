const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function saveShopperData(req, res, next) {
  try {
    const shopperDetails = JSON.parse(req.form.shopperDetails);
    session.privacy.shopperDetails = JSON.stringify(shopperDetails);
    res.json({ success: true });
    return next();
  } catch (ex) {
    AdyenLogs.error_log(
      `Failed to save the shopper details ${ex.toString()} in ${ex.fileName}:${
        ex.lineNumber
      }`,
    );
    res.json({ success: false });
    return next();
  }
}

module.exports = saveShopperData;
