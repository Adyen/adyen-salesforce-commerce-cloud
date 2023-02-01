const ShippingMgr = require('dw/order/ShippingMgr');
const BasketMgr = require('dw/order/BasketMgr');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
const ShippingMethodModel = require('*/cartridge/models/shipping/shippingMethod');
const collections = require('*/cartridge/scripts/util/collections');
const Logger = require('dw/system/Logger');
const CartModel = require('*/cartridge/models/cart');

function updateShippingMethods(req, res, next) {
  try {
    Logger.getLogger('Adyen').error('inside updateShippingMethods')
    const currentBasket = BasketMgr.getCurrentBasket();
//    const basketModel = JSON.parse(req.form.basketModel);
//    Logger.getLogger('Adyen').error('basket model ' + JSON.stringify(basketModel))
    var basketModel = new CartModel(currentBasket);
    Logger.getLogger('Adyen').error('basket model ' + JSON.stringify(basketModel))
    res.render('cart/cart2', basketModel);
//    res.render('/home/homePage');
    Logger.getLogger('Adyen').error('after res render cart 2')
    return next();
  } catch (error) {
    Logger.getLogger('Adyen').error('inside catch ')
    AdyenLogs.error_log('Failed to fetch shipping methods');
    AdyenLogs.error_log(error);
    return next();
  }
}

module.exports = updateShippingMethods;
