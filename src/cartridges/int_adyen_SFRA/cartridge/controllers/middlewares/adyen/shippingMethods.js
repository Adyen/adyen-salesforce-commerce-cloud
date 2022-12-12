const ShippingMgr = require('dw/order/ShippingMgr');
const Logger = require('dw/system/Logger');

/**
 * Make a request to Adyen to get shipping methods
 */
function callGetShippingMethods(req, res, next) {
  try {
    const currentShippingMethods = ShippingMgr.getAllShippingMethods();
    res.json({
      shippingMethods: currentShippingMethods?.toArray().map((sm) => ({
        label: sm.displayName,
        detail: sm.description,
        identifier: sm.ID,
        amount: '100',
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
