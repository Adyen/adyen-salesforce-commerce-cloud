"use strict";

var URLUtils = require('dw/web/URLUtils');
var BasketMgr = require('dw/order/BasketMgr');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var paypalHelper = require('*/cartridge/adyen/utils/paypalHelper');
function saveShopperData(req, res, next) {
  try {
    var shopperDetails = JSON.parse(req.form.shopperDetails);
    var currentBasket = BasketMgr.getCurrentBasket();
    paypalHelper.setBillingAndShippingAddress(currentBasket, shopperDetails);
    res.json({
      success: true
    });
    return next();
  } catch (error) {
    AdyenLogs.error_log('Failed to save the shopper details:', error);
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}
module.exports = saveShopperData;