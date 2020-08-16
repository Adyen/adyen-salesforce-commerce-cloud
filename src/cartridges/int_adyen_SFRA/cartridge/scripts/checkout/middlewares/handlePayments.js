const Transaction = require('dw/system/Transaction');
const HookMgr = require('dw/system/HookMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const OrderMgr = require('dw/order/OrderMgr');

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {Object} an error object
 */
function handlePayments(order, orderNumber) {
  let result = {};
  if (order.totalNetPrice !== 0.0) {
    const { paymentInstruments } = order;

    if (paymentInstruments.length === 0) {
      Transaction.wrap(() => {
        OrderMgr.failOrder(order, true);
      });
      result.error = true;
    }
    if (!result.error) {
      for (let i = 0; i < paymentInstruments.length; i++) {
        const paymentInstrument = paymentInstruments[i];
        const { paymentProcessor } = PaymentMgr.getPaymentMethod(
          paymentInstrument.paymentMethod,
        );
        let authorizationResult;

        if (paymentProcessor === null) {
          Transaction.begin();
          paymentInstrument.paymentTransaction.setTransactionID(orderNumber);
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
              orderNumber,
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
              OrderMgr.failOrder(order, true);
            });
            result.error = true;
            break;
          }
        }
      }
    }
  }

  return result;
}

module.exports = handlePayments;
