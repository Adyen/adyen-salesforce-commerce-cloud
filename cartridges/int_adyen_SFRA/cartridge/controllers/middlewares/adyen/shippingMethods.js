"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

/**
 * Make a request to Adyen to get shipping methods
 */
function callGetShippingMethods(req, res, next) {
  try {
    var address = null;
    if (req.querystring) {
      address = {
        city: req.querystring.city,
        countryCode: req.querystring.countryCode,
        stateCode: req.querystring.stateCode
      };
    }
    var currentBasket = BasketMgr.getCurrentBasket();
    var currentShippingMethodsModels = AdyenHelper.getApplicableShippingMethods(currentBasket.getDefaultShipment(), address);
    res.json({
      shippingMethods: currentShippingMethodsModels
    });
    return next();
  } catch (error) {
    AdyenLogs.error_log('Failed to fetch shipping methods');
    AdyenLogs.error_log(error);
    return next();
  }
}
module.exports = callGetShippingMethods;