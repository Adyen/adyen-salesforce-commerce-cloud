const BasketMgr = require('dw/order/BasketMgr');
const URLUtils = require('dw/web/URLUtils');
const {
  createOrder,
} = require('*/cartridge/controllers/middlewares/checkout_services/utils/index');
const Logger = require('dw/system/Logger');
function placeOrder(req, res, next) {
  const cbEmitter = (route) => this.emit(route, req, res);
  const currentBasket = BasketMgr.getCurrentBasket();
  if (!currentBasket) {
    Logger.getLogger('Adyen').error('no currentbasket');
    res.json({
      error: true,
      cartError: true,
      fieldErrors: [],
      serverErrors: [],
      redirectUrl: URLUtils.url('Cart-Show').toString(),
    });
    return next();
  }

  Logger.getLogger('Adyen').error('yes currentbasket');
  return createOrder(currentBasket, { req, res, next }, cbEmitter);
}

module.exports = placeOrder;
