const BasketMgr = require('dw/order/BasketMgr');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');
const cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function addProductToBasket(
  tempBasket,
  productId,
  selectedQuantity,
  bundledProducts,
  options,
) {
  let result;
  Transaction.wrap(() => {
    result = {
      error: false,
      message: Resource.msg(
        'text.alert.createdTemporaryBasket',
        'product',
        null,
      ),
    };
    const quantity = parseInt(selectedQuantity, 10);
    result = cartHelper.addProductToCart(
      tempBasket,
      productId,
      quantity,
      bundledProducts,
      options,
    );

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
    Transaction.wrap(() => {
      session.privacy.temporaryBasketId = null;
      BasketMgr.getTemporaryBaskets()
        .toArray()
        .forEach((basket) => {
          BasketMgr.deleteTemporaryBasket(basket);
        });
    });

    // Create a new temporary basket
    const tempBasket = BasketMgr.createTemporaryBasket();
    if (!tempBasket) {
      throw new Error('Temporary basket not created');
    }
    session.privacy.temporaryBasketId = tempBasket.UUID;

    const { id, bundledProducts, options, selectedQuantity } = JSON.parse(
      req.form.data,
    );

    addProductToBasket(
      tempBasket,
      id,
      selectedQuantity,
      bundledProducts,
      options,
    );
    const amount = {
      value: tempBasket.getTotalGrossPrice().value,
      currency: tempBasket.getTotalGrossPrice().currencyCode,
    };
    res.json({
      temporaryBasketCreated: true,
      amount,
    });
  } catch (error) {
    AdyenLogs.error_log('Failed to create temporary basket', error);
    session.privacy.temporaryBasketId = null;
    res.setStatusCode(500);
    res.json({
      errorMessage: Resource.msg(
        'error.cannot.create.temporary.basket',
        'product',
        null,
      ),
    });
  }
  return next();
}

module.exports = createTemporaryBasket;
