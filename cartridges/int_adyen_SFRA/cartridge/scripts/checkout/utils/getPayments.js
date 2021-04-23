"use strict";

var Transaction = require('dw/system/Transaction');

var HookMgr = require('dw/system/HookMgr');

var PaymentMgr = require('dw/order/PaymentMgr');

var OrderMgr = require('dw/order/OrderMgr');

var getAuthorizationResult = function getAuthorizationResult(pProcessor, orderNo, pInstrument) {
  var hookName = "app.payment.processor.".concat(pProcessor.ID.toLowerCase());

  var customAuthorizeHook = function customAuthorizeHook() {
    return HookMgr.callHook(hookName, 'Authorize', orderNo, pInstrument, pProcessor);
  };

  return HookMgr.hasHook(hookName) ? customAuthorizeHook() : HookMgr.callHook('app.payment.processor.default', 'Authorize');
};

var getPayments = function getPayments(order, orderNumber) {
  return order.paymentInstruments.toArray().reduce(function (acc, paymentInstrument) {
    if (!acc.error) {
      var _PaymentMgr$getPaymen = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod),
          paymentProcessor = _PaymentMgr$getPaymen.paymentProcessor;

      if (paymentProcessor) {
        var authorizationResult = getAuthorizationResult(paymentProcessor, orderNumber, paymentInstrument);

        if (authorizationResult.error) {
          Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
          });
        }

        return authorizationResult;
      }

      Transaction.begin();
      paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
      Transaction.commit();
    }

    return acc;
  }, {});
};

module.exports = getPayments;