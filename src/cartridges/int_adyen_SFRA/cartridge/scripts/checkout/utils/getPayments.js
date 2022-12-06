const Transaction = require('dw/system/Transaction');
const HookMgr = require('dw/system/HookMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const OrderMgr = require('dw/order/OrderMgr');

const getAuthorizationResult = (pProcessor, order, pInstrument) => {
  const hookName = `app.payment.processor.${pProcessor.ID.toLowerCase()}`;
  const customAuthorizeHook = () =>
    HookMgr.callHook(hookName, 'Authorize', order, pInstrument, pProcessor);

  return HookMgr.hasHook(hookName)
    ? customAuthorizeHook()
    : HookMgr.callHook('app.payment.processor.default', 'Authorize');
};

const getPayments = (order) =>
  order.paymentInstruments.toArray().reduce((acc, paymentInstrument) => {
    if (!acc.error) {
      const { paymentProcessor } = PaymentMgr.getPaymentMethod(
        paymentInstrument.paymentMethod,
      );

      if (paymentProcessor) {
        const authorizationResult = getAuthorizationResult(
          paymentProcessor,
          order,
          paymentInstrument,
        );

        if (authorizationResult.error) {
          Transaction.wrap(() => {
            OrderMgr.failOrder(order, true);
          });
        }

        return authorizationResult;
      }

      Transaction.begin();
      paymentInstrument.paymentTransaction.setTransactionID(order.orderNo);
      Transaction.commit();
    }
    return acc;
  }, {});

module.exports = getPayments;
