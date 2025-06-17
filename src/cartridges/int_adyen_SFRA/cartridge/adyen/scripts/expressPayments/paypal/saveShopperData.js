const URLUtils = require('dw/web/URLUtils');
const BasketMgr = require('dw/order/BasketMgr');
const paypalHelper = require('*/cartridge/adyen/utils/paypalHelper');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const setErrorType = require('*/cartridge/adyen/logs/setErrorType');

function saveShopperData(req, res, next) {
  try {
    const shopperDetails = JSON.parse(req.form.data);
    const currentBasket = BasketMgr.getCurrentBasket();
    paypalHelper.setBillingAndShippingAddress(currentBasket, shopperDetails);
    res.json({ success: true });
    return next();
  } catch (error) {
    AdyenLogs.error_log('Failed to save the shopper details:', error);
    setErrorType(error, res, {
      redirectUrl: URLUtils.url('Error-ErrorCode', 'err', 'general').toString(),
    });
    return next();
  }
}

module.exports = saveShopperData;
