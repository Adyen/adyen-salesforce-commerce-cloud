const BasketMgr = require('dw/order/BasketMgr');
const Transaction = require('dw/system/Transaction');
const Resource = require('dw/web/Resource');
const cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
const basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function createTemporaryBasket(req, res, next) {
  try {
    // Delete any existing open temporary baskets
    Transaction.wrap(() => {
      BasketMgr.getTemporaryBaskets()
        .toArray()
        .forEach((basket) => {
          BasketMgr.deleteTemporaryBasket(basket);
        });
    });

    // Create a new temporary basket
    const tempBasket = BasketMgr.createTemporaryBasket();
    // AdyenLogs.debug_log(JSON.stringify(req.form['selected-express-product']));
    const product = JSON.parse(req.form['selected-express-product']);
    const productId = product.id;
    const childProducts = product.bundledProducts || [];
    const options = product.options || [];
    const quantity = parseInt(product.selectedQuantity, 10);
    let result;

    if (tempBasket) {
      Transaction.wrap(() => {
        result = {
          error: false,
          message: Resource.msg(
            'text.alert.createdTemporaryBasket',
            'product',
            null,
          ),
        };
        result = cartHelper.addProductToCart(
          tempBasket,
          productId,
          quantity,
          childProducts,
          options,
        );

        if (!result.error) {
          cartHelper.ensureAllShipmentsHaveMethods(tempBasket);
          basketCalculationHelpers.calculateTotals(tempBasket);
        }
      });
    }
    const amount = {
      value: tempBasket.getTotalGrossPrice().value,
      currency: tempBasket.getTotalGrossPrice().currencyCode,
    };
    res.json({
      basketId: tempBasket.UUID,
      amount,
      message: result.message,
      error: result.error,
    });
  } catch (error) {
    AdyenLogs.error_log('Failed to create temporary basket', error);
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
