const BasketMgr = require('dw/order/BasketMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const constants = require('*/cartridge/adyenConstants/constants');
const collections = require('*/cartridge/scripts/util/collections');

function paymentFromComponent(req, res, next) {
  const reqDataObj = JSON.parse(req.form.data);

  if (reqDataObj.cancelTransaction) {
    Logger.getLogger('Adyen').error(
      `Shopper cancelled transaction for order ${session.privacy.orderNo}`,
    );
    return {};
  }
  const currentBasket = BasketMgr.getCurrentBasket();

  let paymentInstrument;
  Transaction.wrap(() => {
    collections.forEach(currentBasket.getPaymentInstruments(), (item) => {
      currentBasket.removePaymentInstrument(item);
    });
    paymentInstrument = currentBasket.createPaymentInstrument(
      constants.METHOD_ADYEN_COMPONENT,
      currentBasket.totalGrossPrice,
    );
    const { paymentProcessor } = PaymentMgr.getPaymentMethod(
      paymentInstrument.paymentMethod,
    );
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    paymentInstrument.custom.adyenPaymentData = req.form.data;
    paymentInstrument.custom.adyenPaymentMethod = req.form.paymentMethod;
  });
  const order = COHelpers.createOrder(currentBasket);
  session.privacy.orderNo = order.orderNo;

  const result = adyenCheckout.createPaymentRequest({
    Order: order,
    PaymentInstrument: paymentInstrument,
  });

  res.json(result);
  return next();
}

module.exports = paymentFromComponent;
