const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const { getPayments } = require('*/cartridge/scripts/checkout/utils/index');
const Logger = require('dw/system/Logger');
const constants = require('*/cartridge/adyenConstants/constants');
const PaymentMgr = require('dw/order/PaymentMgr');
const Money = require('dw/value/Money');

/**
 * handles the payment authorization for each payment instrument
 * @param {dw.order.Order} order - the order object
 * @param {string} orderNumber - The order number for the order
 * @returns {Object} an error object
 */
function handlePayments(order) {
  if (order.totalNetPrice === 0.0) {
    return {};
  }

  if (order.paymentInstruments.length) {
//    Logger.getLogger('Adyen').error('order.paymentInstruments.length ' + order.paymentInstruments.length);
//    let paymentInstrument;
//    const paidGiftcardAmount = JSON.parse(session.privacy.giftCardResponse).amount;
//    Transaction.wrap(() => {
//        paymentInstrument = order.createPaymentInstrument(
//            constants.METHOD_ADYEN_COMPONENT,
//            new Money(paidGiftcardAmount.value, paidGiftcardAmount.currency).divide(100),
//        );
//        const { paymentProcessor } = PaymentMgr.getPaymentMethod(
//            paymentInstrument.paymentMethod,
//        );
//      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
//      paymentInstrument.custom.adyenPaymentMethod = `giftcard` ;
//      paymentInstrument.paymentTransaction.custom.Adyen_log = session.privacy.giftCardResponse;
//    })
//
//    Logger.getLogger('Adyen').error('order.paymentInstruments.length ' + order.paymentInstruments.length);

    return getPayments(order);
  }

  Transaction.wrap(() => {
    OrderMgr.failOrder(order, true);
  });
  return { error: true };
}

module.exports = {
  handlePayments,
};
