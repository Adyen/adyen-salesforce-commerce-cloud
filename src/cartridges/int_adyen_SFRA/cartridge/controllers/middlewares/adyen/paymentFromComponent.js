const BasketMgr = require('dw/order/BasketMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const Logger = require('dw/system/Logger');
const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const URLUtils = require('dw/web/URLUtils');
const Money = require('dw/value/Money');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const constants = require('*/cartridge/adyenConstants/constants');
const collections = require('*/cartridge/scripts/util/collections');

/**
 * Make a payment from inside a component, skipping the summary page. (paypal, QRcodes, MBWay)
 */
function paymentFromComponent(req, res, next) {
  const reqDataObj = JSON.parse(req.form.data);
  if (reqDataObj.cancelTransaction) {
    Logger.getLogger('Adyen').error(
      `Shopper cancelled paymentFromComponent transaction for order ${reqDataObj.merchantReference}`,
    );

    const order = OrderMgr.getOrder(
      reqDataObj.merchantReference,
      reqDataObj.orderToken,
    );
    Transaction.wrap(() => {
      OrderMgr.failOrder(order, true);
    });
    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder'));
    return next();
  }
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


      Logger.getLogger('Adyen').error('reqDataObj.splitPaymentsOrder ' + JSON.stringify(reqDataObj.splitPaymentsOrder));
    if(reqDataObj.splitPaymentsOrder) {
      Logger.getLogger('Adyen').error('inside reqDataObj.splitPaymentsOrder');
      paymentInstrument.custom.adyenSplitPaymentsOrder = JSON.stringify(reqDataObj.splitPaymentsOrder);
    }
    paymentInstrument.custom.adyenPaymentMethod = req.form.paymentMethod;
  });
      Logger.getLogger('Adyen').error('being filled when it should not fromComponent');
  const order = COHelpers.createOrder(currentBasket);

  let result;
  Transaction.wrap(() => {
    result = adyenCheckout.createPaymentRequest({
      Order: order,
      PaymentInstrument: paymentInstrument,
    });
  });

  if (result.resultCode === constants.RESULTCODES.REFUSED) {
    Logger.getLogger('Adyen').error(
      `Payment refused for order ${order.orderNo}`,
    );
    result.paymentError = true;

    // Decline flow for Amazon pay is handled different from other Component PMs
    // Order needs to be failed here to handle Amazon decline flow.
    if (reqDataObj.paymentMethod === 'amazonpay') {
      Transaction.wrap(() => {
        OrderMgr.failOrder(order, true);
      });
    }
  }

    Logger.getLogger('Adyen').error('session.privacy.giftCardResponse ' + session.privacy.giftCardResponse);
    //Check if gift card was used
    if(session.privacy.giftCardResponse) {
        Logger.getLogger('Adyen').error('order.paymentInstruments.length ' + order.paymentInstruments.length);
        let paymentInstrument;
        const paidGiftcardAmount = JSON.parse(session.privacy.giftCardResponse).amount;
        Transaction.wrap(() => {
            paymentInstrument = order.createPaymentInstrument(
                constants.METHOD_ADYEN_COMPONENT,
                new Money(paidGiftcardAmount.value, paidGiftcardAmount.currency).divide(100),
            );
            const { paymentProcessor } = PaymentMgr.getPaymentMethod(
                paymentInstrument.paymentMethod,
            );
          paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
          paymentInstrument.custom.adyenPaymentMethod = `giftcard` ;
          paymentInstrument.paymentTransaction.custom.Adyen_log = session.privacy.giftCardResponse;
        })

        Logger.getLogger('Adyen').error('order.paymentInstruments.length ' + order.paymentInstruments.length);

        session.privacy.giftCardResponse = null;
    }

  result.orderNo = order.orderNo;
  result.orderToken = order.orderToken;
  res.json(result);
  return next();
}

module.exports = paymentFromComponent;
