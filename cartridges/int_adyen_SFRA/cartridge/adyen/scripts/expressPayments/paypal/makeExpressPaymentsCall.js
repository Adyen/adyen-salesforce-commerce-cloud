"use strict";

var BasketMgr = require('dw/order/BasketMgr');
var PaymentMgr = require('dw/order/PaymentMgr');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
var constants = require('*/cartridge/adyen/config/constants');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var paypalHelper = require('*/cartridge/adyen/utils/paypalHelper');
function makeExpressPaymentsCall(req, res, next) {
  try {
    var currentBasket = BasketMgr.getCurrentBasket();
    var productLines = currentBasket.getAllProductLineItems().toArray();
    var productQuantity = currentBasket.getProductQuantityTotal();
    var hashedProducts = AdyenHelper.getAdyenHash(productLines, productQuantity);
    var paymentInstrument;
    Transaction.wrap(function () {
      currentBasket.removeAllPaymentInstruments();
      paymentInstrument = currentBasket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, currentBasket.getAdjustedMerchandizeTotalNetPrice());
      var _PaymentMgr$getPaymen = PaymentMgr.getPaymentMethod(paymentInstrument.paymentMethod),
        paymentProcessor = _PaymentMgr$getPaymen.paymentProcessor;
      paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
      paymentInstrument.custom.adyenPaymentData = req.form.data;
      currentBasket.custom.adyenProductLineItems = hashedProducts;
    });
    // Creates order number to be utilized for PayPal express
    var paypalExpressOrderNo = OrderMgr.createOrderNo();
    // Create request object with payment details
    var paymentRequest = AdyenHelper.createAdyenRequestObject(paypalExpressOrderNo, null, paymentInstrument);
    paymentRequest.amount = {
      currency: paymentInstrument.paymentTransaction.amount.currencyCode,
      value: AdyenHelper.getCurrencyValueForApi(paymentInstrument.paymentTransaction.amount).getValueOrNull()
    };
    paymentRequest.lineItems = paypalHelper.getLineItems({
      Basket: currentBasket
    }, true);
    paymentRequest.shopperConversionId = session.sessionID.slice(0, 200);
    var result;
    Transaction.wrap(function () {
      result = adyenCheckout.doPaymentsCall(null, paymentInstrument, paymentRequest);
    });
    session.privacy.paypalExpressOrderNo = paypalExpressOrderNo;
    session.privacy.pspReference = result.pspReference;
    res.json(result);
  } catch (error) {
    AdyenLogs.fatal_log('Paypal express payments request failed', error);
    res.setStatusCode(500);
    res.json({
      errorMessage: Resource.msg('error.express.paypal.payments', 'cart', null)
    });
  }
  return next();
}
module.exports = makeExpressPaymentsCall;