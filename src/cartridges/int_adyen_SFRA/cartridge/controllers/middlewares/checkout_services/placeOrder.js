const BasketMgr = require('dw/order/BasketMgr');
const URLUtils = require('dw/web/URLUtils');
const Logger = require('dw/system/Logger');
const { createOrder } = require('./utils/index');

function placeOrder(req, res, next) {
  Logger.getLogger('Adyen').error(JSON.stringify(req));
  Logger.getLogger('Adyen').error(JSON.stringify(req.querystring));
  const cbEmitter = (route) => this.emit(route, req, res);
  const currentBasket = BasketMgr.getCurrentBasket();
  if (!currentBasket) {
    res.json({
      error: true,
      cartError: true,
      fieldErrors: [],
      serverErrors: [],
      redirectUrl: URLUtils.url('Cart-Show').toString(),
    });
    return next();
  }

  return createOrder(currentBasket, { req, res, next }, cbEmitter);
}

module.exports = placeOrder;
