"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var Transaction = require('dw/system/Transaction');
var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');
var Money = require('dw/value/Money');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var constants = require('*/cartridge/adyenConstants/constants');
var collections = require('*/cartridge/scripts/util/collections');
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

/**
 * Make a payment from inside a component, skipping the summary page. (paypal, QRcodes, MBWay)
 */
function paymentFromComponent(req, res, next) {
  var reqDataObj = JSON.parse(req.form.data);
  if (reqDataObj.cancelTransaction) {
    AdyenLogs.info_log("Shopper cancelled paymentFromComponent transaction for order ".concat(reqDataObj.merchantReference));
    var _order = OrderMgr.getOrder(reqDataObj.merchantReference, reqDataObj.orderToken);
    Transaction.wrap(function () {
      OrderMgr.failOrder(_order, true);
    });
    res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder'));
    return next();
  }
  var currentBasket = BasketMgr.getCurrentBasket();
  var paymentInstrument;
  Transaction.wrap(function () {
    collections.forEach(currentBasket.getPaymentInstruments(), function (item) {
      currentBasket.removePaymentInstrument(item);
    });
    paymentInstrument = currentBasket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, currentBasket.totalGrossPrice);
    var _PaymentMgr$getPaymen = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod),
      paymentProcessor = _PaymentMgr$getPaymen.paymentProcessor;
    paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
    paymentInstrument.custom.adyenPaymentData = req.form.data;
    if (reqDataObj.partialPaymentsOrder) {
      paymentInstrument.custom.adyenPartialPaymentsOrder = session.privacy.partialPaymentData;
    }
    paymentInstrument.custom.adyenPaymentMethod = req.form.paymentMethod;
  });
  var order = COHelpers.createOrder(currentBasket);
  var result;
  Transaction.wrap(function () {
    result = adyenCheckout.createPaymentRequest({
      Order: order,
      PaymentInstrument: paymentInstrument
    });
  });
  if (result.resultCode === constants.RESULTCODES.REFUSED) {
    AdyenLogs.error_log("Payment refused for order ".concat(order.orderNo));
    result.paymentError = true;

    // Decline flow for Amazon pay is handled different from other Component PMs
    // Order needs to be failed here to handle Amazon decline flow.
    if (reqDataObj.paymentMethod === 'amazonpay') {
      Transaction.wrap(function () {
        OrderMgr.failOrder(order, true);
      });
    }
  }

  // Check if gift card was used
  if (session.privacy.giftCardResponse) {
    var divideBy = AdyenHelper.getDivisorForCurrency(currentBasket.totalGrossPrice);
    var parsedGiftCardObj = JSON.parse(session.privacy.giftCardResponse);
    var remainingAmount = {
      value: parsedGiftCardObj.remainingAmount.value,
      currency: parsedGiftCardObj.remainingAmount.currency
    };
    var formattedAmount = new Money(remainingAmount.value, remainingAmount.currency).divide(divideBy);
    var mainPaymentInstrument = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT)[0];
    // update amount from order total to PM total
    Transaction.wrap(function () {
      mainPaymentInstrument.paymentTransaction.setAmount(formattedAmount);
    });
    var paidGiftcardAmount = {
      value: parsedGiftCardObj.value,
      currency: parsedGiftCardObj.currency
    };
    var formattedGiftcardAmount = new Money(paidGiftcardAmount.value, paidGiftcardAmount.currency).divide(divideBy);
    Transaction.wrap(function () {
      var giftcardPM = order.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, formattedGiftcardAmount);
      var _PaymentMgr$getPaymen2 = PaymentMgr.getPaymentMethod(giftcardPM.paymentMethod),
        paymentProcessor = _PaymentMgr$getPaymen2.paymentProcessor;
      giftcardPM.paymentTransaction.paymentProcessor = paymentProcessor;
      giftcardPM.custom.adyenPaymentMethod = parsedGiftCardObj.brand;
      giftcardPM.paymentTransaction.custom.Adyen_log = session.privacy.giftCardResponse;
      giftcardPM.paymentTransaction.custom.Adyen_pspReference = parsedGiftCardObj.giftCardpspReference;
    });
  }
  result.orderNo = order.orderNo;
  result.orderToken = order.orderToken;
  res.json(result);
  return next();
}
module.exports = paymentFromComponent;