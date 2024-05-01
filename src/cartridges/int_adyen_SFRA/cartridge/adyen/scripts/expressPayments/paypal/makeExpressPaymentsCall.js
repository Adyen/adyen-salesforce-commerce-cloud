const BasketMgr = require('dw/order/BasketMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const Transaction = require('dw/system/Transaction');
const adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
const constants = require('*/cartridge/adyen/config/constants');
const collections = require('*/cartridge/scripts/util/collections');
const AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');

function makeExpressPaymentsCall(req, res, next) {
  try {
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
    });

    let result;
    Transaction.wrap(() => {
      result = adyenCheckout.createPaymentRequest({
        Order: '',
        PaymentInstrument: paymentInstrument,
      });
    });
    res.json(result);
    return next();
  } catch (ex) {
    AdyenLogs.fatal_log(`${ex.toString()} in ${ex.fileName}:${ex.lineNumber}`);
    return next();
  }
}

module.exports = makeExpressPaymentsCall;
