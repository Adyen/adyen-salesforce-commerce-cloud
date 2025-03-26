const URLUtils = require('dw/web/URLUtils');
const BasketMgr = require('dw/order/BasketMgr');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const paypalHelper = require('*/cartridge/adyen/utils/paypalHelper');

function saveShopperData(req, res, next) {
  try {
    const shopperDetails = JSON.parse(req.form.shopperDetails);
    const currentBasket = BasketMgr.getCurrentBasket();
    paypalHelper.setBillingAndShippingAddress(currentBasket, shopperDetails);
    res.json({ success: true });
    return next();
  } catch (error) {
    AdyenLogs.error_log('Failed to save the shopper details:', error);
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = saveShopperData;
