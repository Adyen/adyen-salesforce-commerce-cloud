"use strict";

var ShippingMgr = require('dw/order/ShippingMgr');
var BasketMgr = require('dw/order/BasketMgr');
var Logger = require('dw/system/Logger');

/**
 * Make a request to Adyen to get shipping methods
 */
function callGetShippingMethods(req, res, next) {
  try {
    var currentBasket = BasketMgr.getCurrentBasket();
    var currentShippingMethods = ShippingMgr.getAllShippingMethods();
    res.json({
      shippingMethods: currentShippingMethods === null || currentShippingMethods === void 0 ? void 0 : currentShippingMethods.toArray().map(function (sm) {
        var _ShippingMgr$getShipp;
        return {
          label: sm.displayName,
          detail: sm.description,
          identifier: sm.ID,
          amount: "".concat((_ShippingMgr$getShipp = ShippingMgr.getShippingCost(sm, currentBasket.totalGrossPrice)) === null || _ShippingMgr$getShipp === void 0 ? void 0 : _ShippingMgr$getShipp.value)
        };
      })
    });
    return next();
  } catch (error) {
    Logger.getLogger('Adyen').error('Failed to fetch shipping methods');
    Logger.getLogger('Adyen').error(error);
    return next();
  }
}
module.exports = callGetShippingMethods;