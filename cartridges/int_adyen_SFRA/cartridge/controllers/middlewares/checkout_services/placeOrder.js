"use strict";

var BasketMgr = require('dw/order/BasketMgr');

var URLUtils = require('dw/web/URLUtils');

var _require = require('*/cartridge/controllers/middlewares/checkout_services/utils/index'),
    createOrder = _require.createOrder;

function placeOrder(req, res, next) {
  var _this = this;

  var cbEmitter = function cbEmitter(route) {
    return _this.emit(route, req, res);
  };

  var currentBasket = BasketMgr.getCurrentBasket();

  if (!currentBasket) {
    res.json({
      error: true,
      cartError: true,
      fieldErrors: [],
      serverErrors: [],
      redirectUrl: URLUtils.url('Cart-Show').toString()
    });
    return next();
  }

  return createOrder(currentBasket, {
    req: req,
    res: res,
    next: next
  }, cbEmitter);
}

module.exports = placeOrder;