"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
function addProductToBasket(tempBasket, productId, selectedQuantity, bundledProducts, options) {
  var result;
  Transaction.wrap(function () {
    result = {
      error: false,
      message: Resource.msg('text.alert.createdTemporaryBasket', 'product', null)
    };
    var quantity = parseInt(selectedQuantity, 10);
    result = cartHelper.addProductToCart(tempBasket, productId, quantity, bundledProducts, options);
    if (!result.error) {
      cartHelper.ensureAllShipmentsHaveMethods(tempBasket);
      basketCalculationHelpers.calculateTotals(tempBasket);
    } else {
      throw new Error(result.message);
    }
  });
}
function createTemporaryBasket(req, res, next) {
  try {
    // Delete any existing open temporary baskets
    Transaction.wrap(function () {
      session.privacy.temporaryBasketId = null;
      BasketMgr.getTemporaryBaskets().toArray().forEach(function (basket) {
        BasketMgr.deleteTemporaryBasket(basket);
      });
    });

    // Create a new temporary basket
    var tempBasket = BasketMgr.createTemporaryBasket();
    if (!tempBasket) {
      throw new Error('Temporary basket not created');
    }
    session.privacy.temporaryBasketId = tempBasket.UUID;
    var _JSON$parse = JSON.parse(req.form.data),
      id = _JSON$parse.id,
      bundledProducts = _JSON$parse.bundledProducts,
      options = _JSON$parse.options,
      selectedQuantity = _JSON$parse.selectedQuantity;
    addProductToBasket(tempBasket, id, selectedQuantity, bundledProducts, options);
    var amount = {
      value: tempBasket.getTotalGrossPrice().value,
      currency: tempBasket.getTotalGrossPrice().currencyCode
    };
    res.json({
      temporaryBasketCreated: true,
      amount: amount
    });
  } catch (error) {
    AdyenLogs.error_log('Failed to create temporary basket', error);
    session.privacy.temporaryBasketId = null;
    res.setStatusCode(500);
    res.json({
      errorMessage: Resource.msg('error.cannot.create.temporary.basket', 'product', null)
    });
  }
  return next();
}
module.exports = createTemporaryBasket;