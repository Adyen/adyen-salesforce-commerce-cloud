const ShippingMgr = require('dw/order/ShippingMgr');
const BasketMgr = require('dw/order/BasketMgr');
const Logger = require('dw/system/Logger');

/**
 * Make a request to Adyen to get shipping methods
 */
function callGetShippingMethods(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const currentShippingMethods = ShippingMgr.getAllShippingMethods();
    res.json({
      shippingMethods: currentShippingMethods?.toArray().map((sm) => ({
        label: sm.displayName,
        detail: sm.description,
        identifier: sm.ID,
        amount: `${
          ShippingMgr.getShippingCost(sm, currentBasket.totalGrossPrice)?.value
        }`,
      })),
    });
    return next();
  } catch (error) {
    Logger.getLogger('Adyen').error('Failed to fetch shipping methods');
    Logger.getLogger('Adyen').error(error);
    return next();
  }
}

module.exports = callGetShippingMethods;