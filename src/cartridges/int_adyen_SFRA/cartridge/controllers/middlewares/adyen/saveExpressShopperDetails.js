const URLUtils = require('dw/web/URLUtils');
const Transaction = require('dw/system/Transaction');
const BasketMgr = require('dw/order/BasketMgr');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

function saveExpressShopperDetails(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    Transaction.wrap(() => {
      currentBasket.custom.amazonExpressShopperDetails =
        req.form.shopperDetails;
    });
    res.json({ success: true });
    return next();
  } catch (e) {
    AdyenLogs.error_log('Could not save amazon express shopper details');
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = saveExpressShopperDetails;
