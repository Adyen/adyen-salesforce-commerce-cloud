const PaymentMgr = require('dw/order/PaymentMgr');
const Transaction = require('dw/system/Transaction');
const constants = require('*/cartridge/adyenConstants/constants');
const collections = require('*/cartridge/scripts/util/collections');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

function getProcessedPaymentInstrument(basket, requestForm) {
  let paymentInstrument;
  Transaction.wrap(() => {
    collections.forEach(basket.getPaymentInstruments(), (item) => {
      basket.removePaymentInstrument(item);
    });
    paymentInstrument = basket.createPaymentInstrument(
      constants.METHOD_ADYEN_COMPONENT,
      basket.totalGrossPrice,
    );
    const { paymentProcessor } = PaymentMgr.getPaymentMethod(
      paymentInstrument.paymentMethod,
    );
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    paymentInstrument.custom.adyenPaymentData = requestForm.data;
    paymentInstrument.custom.adyenPaymentMethod = requestForm.paymentMethod;
  });
  return paymentInstrument;
}

function handlePayment(response, order, paymentInstrument) {
  let result;
  Transaction.wrap(() => {
    result = adyenCheckout.createPaymentRequest({
      Order: order,
      PaymentInstrument: paymentInstrument,
    });
  });

  result.orderNo = order.orderNo;
  response.json(result);
}

module.exports = {
  getProcessedPaymentInstrument,
  handlePayment,
};
