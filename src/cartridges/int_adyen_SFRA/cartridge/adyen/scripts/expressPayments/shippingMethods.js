const BasketMgr = require('dw/order/BasketMgr');
const Transaction = require('dw/system/Transaction');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');

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
        postalCode: req.querystring.postalCode,
      };
    }
    const currentBasket = BasketMgr.getCurrentBasket();
    const shipment = currentBasket.getDefaultShipment();
    Transaction.wrap(() => {
      let { shippingAddress } = shipment;
      if (!shippingAddress) {
        shippingAddress = currentBasket
          .getDefaultShipment()
          .createShippingAddress();
      }
      shippingAddress.setCity(address.city);
      shippingAddress.setPostalCode(address.postalCode);
      shippingAddress.setStateCode(address.stateCode);
      shippingAddress.setCountryCode(address.countryCode);
    });
    const currentShippingMethodsModels =
      AdyenHelper.getApplicableShippingMethods(shipment, address);
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
