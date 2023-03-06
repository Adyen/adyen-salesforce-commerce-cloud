const BasketMgr = require('dw/order/BasketMgr');
const Resource = require('dw/web/Resource');
const Transaction = require('dw/system/Transaction');
const URLUtils = require('dw/web/URLUtils');
const CartModel = require('*/cartridge/models/cart');
const shippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

/**
 * Make a request to Adyen to select shipping methods
 */
// eslint-disable-next-line complexity
function callSelectShippingMethod(req, res, next) {
  const currentBasket = BasketMgr.getCurrentBasket();

  if (!currentBasket) {
    res.json({
      error: true,
      redirectUrl: URLUtils.url('Cart-Show').toString(),
    });

    return next();
  }

  let error = false;

  const shipUUID = req.querystring.shipmentUUID || req.form.shipmentUUID;
  const methodID = req.querystring.methodID || req.form.methodID;
  let shipment;
  if (shipUUID) {
    shipment = shippingHelper.getShipmentByUUID(currentBasket, shipUUID);
  } else {
    shipment = currentBasket.defaultShipment;
  }

  Transaction.wrap(() => {
    shippingHelper.selectShippingMethod(shipment, methodID);

    if (currentBasket && !shipment.shippingMethod) {
      error = true;
      return;
    }

    basketCalculationHelpers.calculateTotals(currentBasket);
  });

  if (!error) {
    const basketModel = new CartModel(currentBasket);
    const grandTotalAmount = {
      value: currentBasket.getTotalGrossPrice().value,
      currency: currentBasket.getTotalGrossPrice().currencyCode,
    };
    res.json({ ...basketModel, grandTotalAmount });
  } else {
    res.setStatusCode(500);
    res.json({
      errorMessage: Resource.msg(
        'error.cannot.select.shipping.method',
        'cart',
        null,
      ),
    });
  }
  return next();
}

module.exports = callSelectShippingMethod;
