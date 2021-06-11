const BasketMgr = require('dw/order/BasketMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const URLUtils = require('dw/web/URLUtils');
const Resource = require('dw/web/Resource');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const constants = require('*/cartridge/adyenConstants/constants');
const collections = require('*/cartridge/scripts/util/collections');

function paymentFromComponent(req, res, next) {
  const reqDataObj = JSON.parse(req.form.data);
  Logger.getLogger('Adyen').error(
    `reqDataObj is ${JSON.stringify(reqDataObj)}`,
  );

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
  Logger.getLogger('Adyen').error(`Order is ${order}`);
  Logger.getLogger('Adyen').error(`paymentInstrument is ${paymentInstrument}`);

  let result;
  Transaction.wrap(() => {
    result = adyenCheckout.createPaymentRequest({
      Order: order,
      PaymentInstrument: paymentInstrument,
    });
  });

  Logger.getLogger('Adyen').error('before if statement');
  Logger.getLogger('Adyen').error(JSON.stringify(reqDataObj));

  // if (result.error && reqDataObj.paymentMethod.type === 'amazonpay') {
  //   Logger.getLogger('Adyen').error('inside result error amazonpay');
  //   try {
  //     Transaction.wrap(() => {
  //       OrderMgr.failOrder(order, true);
  //     });
  //
  //     res.redirect(
  //         URLUtils.url(
  //             'Checkout-Begin',
  //             'stage',
  //             'payment',
  //             'paymentError',
  //             Resource.msg('error.payment.not.valid', 'checkout', null),
  //         ),
  //     );
  //     return next();
  //   } catch(e) {
  //     Logger.getLogger('Adyen').error('inside catch ' + e);
  //   }
  //
  // }
  // else {
    Logger.getLogger('Adyen').error(`result is ${JSON.stringify(result)}`);
    result.orderNo = order.orderNo;
    res.json(result);
    return next();
  // }
}

module.exports = paymentFromComponent;
