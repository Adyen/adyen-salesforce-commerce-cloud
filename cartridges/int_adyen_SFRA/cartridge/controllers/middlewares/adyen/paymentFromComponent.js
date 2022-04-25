"use strict";

var BasketMgr = require('dw/order/BasketMgr');

var PaymentMgr = require('dw/order/PaymentMgr');

var Logger = require('dw/system/Logger');

var Transaction = require('dw/system/Transaction');

var OrderMgr = require('dw/order/OrderMgr');

var URLUtils = require('dw/web/URLUtils');

var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var constants = require('*/cartridge/adyenConstants/constants');

var collections = require('*/cartridge/scripts/util/collections');
/**
 * Make a payment from inside a component, skipping the summary page. (paypal, QRcodes, MBWay)
 */


function paymentFromComponent(req, res, next) {
  var reqDataObj = JSON.parse(req.form.data);

  if (reqDataObj.cancelTransaction) {
    Logger.getLogger('Adyen').error("Shopper cancelled paymentFromComponent transaction for order ".concat(reqDataObj.merchantReference));

    var _order = OrderMgr.getOrder(reqDataObj.merchantReference, reqDataObj.orderToken);

    Transaction.wrap(function () {
      OrderMgr.failOrder(_order, true);
    });
    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder'));
    return next();
  }

  var currentBasket = BasketMgr.getCurrentBasket();
  var paymentInstrument;
  Transaction.wrap(function () {
    collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
      currentBasket.removePaymentInstrument(item);
    });
    paymentInstrument = currentBasket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, currentBasket.totalGrossPrice);

    var _PaymentMgr$getPaymen = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod),
        paymentProcessor = _PaymentMgr$getPaymen.paymentProcessor;

    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    paymentInstrument.custom.adyenPaymentData = req.form.data;
    paymentInstrument.custom.adyenPaymentMethod = req.form.paymentMethod;
  });
  var order = COHelpers.createOrder(currentBasket);
  var result;
  Transaction.wrap(function () {
    result = adyenCheckout.createPaymentRequest({
      Order: order,
      PaymentInstrument: paymentInstrument
    });
  });

  if (result.resultCode === constants.RESULTCODES.REFUSED) {
    Logger.getLogger('Adyen').error("Payment refused for order ".concat(order.orderNo));
    result.paymentError = true; // Decline flow for Amazon pay is handled different from other Component PMs
    // Order needs to be failed here to handle Amazon decline flow.

    if (reqDataObj.paymentMethod === 'amazonpay') {
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
    }
  }

  result.orderNo = order.orderNo;
  result.orderToken = order.orderToken;
  res.json(result);
  return next();
}

module.exports = paymentFromComponent;