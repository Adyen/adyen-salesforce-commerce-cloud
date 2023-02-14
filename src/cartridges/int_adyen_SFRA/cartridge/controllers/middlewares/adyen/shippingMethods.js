const BasketMgr = require('dw/order/BasketMgr');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

/**
 * Make a request to Adyen to get shipping methods
 */
function callGetShippingMethods(req, res, next) {
  try {
    let address = null;
    if (req.querystring) {
      address = {
        city: req.querystring.city,
        countryCode: req.querystring.countryCode,
        stateCode: req.querystring.stateCode,
      };
    }
    const currentBasket = BasketMgr.getCurrentBasket();
    const currentShippingMethodsModels = AdyenHelper.getApplicableShippingMethods(
      currentBasket.getDefaultShipment(),
      address,
    );
    res.json({
      shippingMethods: currentShippingMethodsModels,
    });
    return next();
  } catch (error) {
    AdyenLogs.error_log('Failed to fetch shipping methods');
    AdyenLogs.error_log(error);
    return next();
  }
}

module.exports = callGetShippingMethods;
