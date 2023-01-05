const ShippingMgr = require('dw/order/ShippingMgr');
const BasketMgr = require('dw/order/BasketMgr');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
const ShippingMethodModel = require('*/cartridge/models/shipping/shippingMethod');
const collections = require('*/cartridge/scripts/util/collections');

function getShippingCost(shippingMethod, shipment) {
  const shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);
  const shippingCost = shipmentShippingModel.getShippingCost(shippingMethod);
  return {
    value: shippingCost.amount.value,
    currencyCode: shippingCost.amount.currencyCode,
  };
}

function getShippingMethods(shipment, address) {
  if (!shipment) return null;

  const shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);

  let shippingMethods;
  if (address) {
    shippingMethods =
      shipmentShippingModel.getApplicableShippingMethods(address);
  } else {
    shippingMethods = shipmentShippingModel.getApplicableShippingMethods();
  }

  return shippingMethods;
}

function getApplicableShippingMethods(shipment, address) {
  const shippingMethods = getShippingMethods(shipment, address);
  if (!shippingMethods) {
    return null;
  }

  // Filter out whatever the method associated with in store pickup
  const filteredMethods = [];
  collections.forEach(shippingMethods, (shippingMethod) => {
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
    AdyenLogs.error_log('Failed to fetch shipping methods');
    AdyenLogs.error_log(error);
    return next();
  }
}

module.exports = callGetShippingMethods;
