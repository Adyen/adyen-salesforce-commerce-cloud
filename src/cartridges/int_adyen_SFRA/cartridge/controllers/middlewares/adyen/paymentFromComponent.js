const BasketMgr = require('dw/order/BasketMgr');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const URLUtils = require('dw/web/URLUtils');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const {
  getProcessedPaymentInstrument,
  handlePayment,
} = require('./paymentFromComponent/utils');

/**
 * Make a payment from inside a component, skipping the summary page. (paypal, QRcodes, MBWay)
 */
function paymentFromComponent(req, res, next) {
  const reqDataObj = JSON.parse(req.form.data);

  if (reqDataObj.cancelTransaction) {
    Logger.getLogger('Adyen').error(
      `Shopper cancelled paymentFromComponent transaction for order ${reqDataObj.merchantReference}`,
    );

    const order = OrderMgr.getOrder(reqDataObj.merchantReference);
    Transaction.wrap(() => {
      OrderMgr.failOrder(order, true);
    });
    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder'));
    return next();
  }

  const currentBasket = BasketMgr.getCurrentBasket();

  const paymentInstrument = getProcessedPaymentInstrument(
    currentBasket,
    req.form,
  );

  const order = COHelpers.createOrder(currentBasket);

  handlePayment(res, order, paymentInstrument);
  return next();
}

module.exports = paymentFromComponent;
