const ShippingMgr = require('dw/order/ShippingMgr');
const BasketMgr = require('dw/order/BasketMgr');
const Logger = require('dw/system/Logger');
const ShippingMethodModel = require('*/cartridge/models/shipping/shippingMethod');
const collections = require('*/cartridge/scripts/util/collections');

/**
 * Make a request to Adyen to get shipping methods
 */
function callGetShippingMethods(req, res, next) {
  try {
    const currentBasket = BasketMgr.getCurrentBasket();
    const currentShippingMethodsModels = getApplicableShippingMethods(
      currentBasket.getDefaultShipment(),
    );
    res.json({
      shippingMethods: currentShippingMethodsModels,
    });
    return next();
  } catch (error) {
    Logger.getLogger('Adyen').error('Failed to fetch shipping methods');
    Logger.getLogger('Adyen').error(error);
    return next();
  }
}

function getShippingCost(shippingMethod, shipment) {
  var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);
  var shippingCost = shipmentShippingModel.getShippingCost(shippingMethod);
  return shippingCost.amount.value;
}

function getApplicableShippingMethods(shipment, address) {
  if (!shipment) return null;

  var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);

  var shippingMethods;
  if (address) {
    shippingMethods = shipmentShippingModel.getApplicableShippingMethods(
      address,
    );
  } else {
    shippingMethods = shipmentShippingModel.getApplicableShippingMethods();
  }

  // Filter out whatever the method associated with in store pickup
  var filteredMethods = [];
  collections.forEach(shippingMethods, function (shippingMethod) {
    if (!shippingMethod.custom.storePickupEnabled) {
      const shippingMethodModel = new ShippingMethodModel(
        shippingMethod,
        shipment,
      );
      const shippingCost = getShippingCost(shippingMethod, shipment);
      filteredMethods.push({
        ...shippingMethodModel,
        shippingCost,
      });
    }
  });

  return filteredMethods;
}

module.exports = callGetShippingMethods;
