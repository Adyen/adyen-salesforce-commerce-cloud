const Transaction = require('dw/system/Transaction');
const HookMgr = require('dw/system/HookMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const OrderMgr = require('dw/order/OrderMgr');
const Logger = require('dw/system/Logger');

const getAuthorizationResult = (pProcessor, order, pInstrument) => {
  const hookName = `app.payment.processor.${pProcessor.ID.toLowerCase()}`;
  const customAuthorizeHook = () =>
    HookMgr.callHook(hookName, 'Authorize', order, pInstrument, pProcessor);

  return HookMgr.hasHook(hookName)
    ? customAuthorizeHook()
    : HookMgr.callHook('app.payment.processor.default', 'Authorize');
};

function getPayments(order) {
    var result = {};
        var paymentInstruments = order.paymentInstruments;
            for (var i = 0; i < paymentInstruments.length; i++) {
                var paymentInstrument = paymentInstruments[i];
                Logger.getLogger('Adyen').error('inside getPayments paymentInstrument ' + paymentInstrument);
                Logger.getLogger('Adyen').error('paymentInstrument.custom.adyenPaymentData ' + JSON.stringify(paymentInstrument.custom.adyenPaymentData));
                if(!paymentInstrument.custom.adyenPaymentData) {
                    continue;
                }
                var paymentProcessor = PaymentMgr
                    .getPaymentMethod(paymentInstrument.paymentMethod)
                    .paymentProcessor;
                var authorizationResult;
                if (paymentProcessor === null) {
                    Transaction.begin();
                    paymentInstrument.paymentTransaction.setTransactionID(order.orderNo);
                    Transaction.commit();
                } else {
                    if (HookMgr.hasHook('app.payment.processor.'
                        + paymentProcessor.ID.toLowerCase())) {
                         Logger.getLogger('Adyen').error('about to call long authorize from getPayments ' );
                        authorizationResult = HookMgr.callHook(
                            'app.payment.processor.' + paymentProcessor.ID.toLowerCase(),
                            'Authorize',
                            order,
                            paymentInstrument,
                            paymentProcessor
                        );
                    } else {
                          Logger.getLogger('Adyen').error('about to call short authorize from getPayments ' );
                        authorizationResult = HookMgr.callHook(
                            'app.payment.processor.default',
                            'Authorize'
                        );
                    }
                    result = authorizationResult;
                    if (authorizationResult.error) {
                        Transaction.wrap(function () {
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