const Transaction = require('dw/system/Transaction');
const HookMgr = require('dw/system/HookMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const OrderMgr = require('dw/order/OrderMgr');

const getAuthorizationResult = (pProcessor, orderNo, pInstrument) => {
  const hookName = `app.payment.processor.${pProcessor.ID.toLowerCase()}`;
  const customAuthorizeHook = () =>
    HookMgr.callHook(hookName, 'Authorize', orderNo, pInstrument, pProcessor);

  return HookMgr.hasHook(hookName)
    ? customAuthorizeHook()
    : HookMgr.callHook('app.payment.processor.default', 'Authorize');
};

const getPayments = (order, orderNumber) =>
  order.paymentInstruments.toArray().reduce((acc, paymentInstrument) => {
    if (!acc.error) {
      const { paymentProcessor } = PaymentMgr.getPaymentMethod(
        paymentInstrument.paymentMethod,
      );

      if (paymentProcessor) {
        const authorizationResult = getAuthorizationResult(
          paymentProcessor,
          orderNumber,
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
      paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
      Transaction.commit();
    }
    return acc;
  }, {});

module.exports = getPayments;
