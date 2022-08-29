const Transaction = require('dw/system/Transaction');
const HookMgr = require('dw/system/HookMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const OrderMgr = require('dw/order/OrderMgr');

// eslint-disable-next-line complexity
function getPayments(order) {
  let result = {};
  const { paymentInstruments } = order;
  for (let i = 0; i < paymentInstruments.length; i += 1) {
    const paymentInstrument = paymentInstruments[i];
    if (!paymentInstrument.custom.adyenPaymentData) {
      continue; // eslint-disable-line no-continue
    }
    const { paymentProcessor } = PaymentMgr.getPaymentMethod(
      paymentInstrument.paymentMethod,
    );
    let authorizationResult;
    if (paymentProcessor === null) {
      Transaction.begin();
      paymentInstrument.paymentTransaction.setTransactionID(order.orderNo);
      Transaction.commit();
    } else {
      if (
        HookMgr.hasHook(
          `app.payment.processor.${paymentProcessor.ID.toLowerCase()}`,
        )
      ) {
        authorizationResult = HookMgr.callHook(
          `app.payment.processor.${paymentProcessor.ID.toLowerCase()}`,
          'Authorize',
          order,
          paymentInstrument,
          paymentProcessor,
        );
      } else {
        authorizationResult = HookMgr.callHook(
          'app.payment.processor.default',
          'Authorize',
        );
      }
      result = authorizationResult;
      if (authorizationResult.error) {
        Transaction.wrap(() => {
          OrderMgr.failOrder(order);
        });
        result.error = true;
        break;
      }
    }
  }
  return result;
}

module.exports = getPayments;
