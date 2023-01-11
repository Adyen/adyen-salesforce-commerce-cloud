const BasketMgr = require('dw/order/BasketMgr');
const PaymentMgr = require('dw/order/PaymentMgr');
const Transaction = require('dw/system/Transaction');
const OrderMgr = require('dw/order/OrderMgr');
const URLUtils = require('dw/web/URLUtils');
const Money = require('dw/value/Money');
const adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
const constants = require('*/cartridge/adyenConstants/constants');
const collections = require('*/cartridge/scripts/util/collections');
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
const AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');
const Logger = require('dw/system/Logger');

/**
 * Make a payment from inside a component, skipping the summary page. (paypal, QRcodes, MBWay)
 */
function paymentFromComponent(req, res, next) {
    Logger.getLogger('Adyen').error('inside paymentFromComponent');
  const reqDataObj = JSON.parse(req.form.data);
  if (reqDataObj.cancelTransaction) {
    AdyenLogs.info_log(
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

    if (reqDataObj.partialPaymentsOrder) {
      paymentInstrument.custom.adyenPartialPaymentsOrder =
        session.privacy.partialPaymentData;
    }
    paymentInstrument.custom.adyenPaymentMethod = req.form.paymentMethod;
  });
  const order = COHelpers.createOrder(currentBasket);

  let result;
  Transaction.wrap(() => {
    result = adyenCheckout.createPaymentRequest({
      Order: order,
      PaymentInstrument: paymentInstrument,
    });
  });

  if (result.resultCode === constants.RESULTCODES.REFUSED) {
    AdyenLogs.error_log(`Payment refused for order ${order.orderNo}`);
    result.paymentError = true;

    // Decline flow for Amazon pay is handled different from other Component PMs
    // Order needs to be failed here to handle Amazon decline flow.
    if (reqDataObj.paymentMethod === 'amazonpay') {
      Transaction.wrap(() => {
        OrderMgr.failOrder(order, true);
      });
    }
  }

  // Check if gift card was used
  if (session.privacy.giftCardResponse) {
    const divideBy = AdyenHelper.getDivisorForCurrency(
      currentBasket.totalGrossPrice,
    );
    const parsedGiftCardObj = JSON.parse(session.privacy.giftCardResponse);
    const remainingAmount = {
      value: parsedGiftCardObj.remainingAmount.value,
      currency: parsedGiftCardObj.remainingAmount.currency,
    };
    const formattedAmount = new Money(
      remainingAmount.value,
      remainingAmount.currency,
    ).divide(divideBy);
    const mainPaymentInstrument = order.getPaymentInstruments(
      constants.METHOD_ADYEN_COMPONENT,
    )[0];
    // update amount from order total to PM total
    Transaction.wrap(() => {
      mainPaymentInstrument.paymentTransaction.setAmount(formattedAmount);
    });

    const paidGiftcardAmount = {
      value: parsedGiftCardObj.value,
      currency: parsedGiftCardObj.currency,
    };
    const formattedGiftcardAmount = new Money(
      paidGiftcardAmount.value,
      paidGiftcardAmount.currency,
    ).divide(divideBy);
    Transaction.wrap(() => {
      const giftcardPM = order.createPaymentInstrument(
        constants.METHOD_ADYEN_COMPONENT,
        formattedGiftcardAmount,
      );
      const { paymentProcessor } = PaymentMgr.getPaymentMethod(
        giftcardPM.paymentMethod,
      );
      giftcardPM.paymentTransaction.paymentProcessor = paymentProcessor;
      giftcardPM.custom.adyenPaymentMethod = parsedGiftCardObj.brand;
      giftcardPM.paymentTransaction.custom.Adyen_log =
        session.privacy.giftCardResponse;
      giftcardPM.paymentTransaction.custom.Adyen_pspReference =
        parsedGiftCardObj.giftCardpspReference;
    });
  }
  result.orderNo = order.orderNo;
  result.orderToken = order.orderToken;
  res.json(result);
  return next();
}

module.exports = paymentFromComponent;
