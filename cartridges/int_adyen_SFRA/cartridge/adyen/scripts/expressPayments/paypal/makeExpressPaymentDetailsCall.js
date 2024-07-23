"use strict";

var URLUtils = require('dw/web/URLUtils');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');
var adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var paypalHelper = require('*/cartridge/adyen/utils/paypalHelper');
var constants = require('*/cartridge/adyen/config/constants');
function setPaymentInstrumentFields(paymentInstrument, response) {
  paymentInstrument.custom.adyenPaymentMethod = AdyenHelper.getAdyenComponentType(response.paymentMethod.type);
  paymentInstrument.custom["".concat(constants.OMS_NAMESPACE, "__Adyen_Payment_Method")] = AdyenHelper.getAdyenComponentType(response.paymentMethod.type);
  paymentInstrument.custom.Adyen_Payment_Method_Variant = response.paymentMethod.type.toLowerCase();
  paymentInstrument.custom["".concat(constants.OMS_NAMESPACE, "__Adyen_Payment_Method_Variant")] = response.paymentMethod.type.toLowerCase();
}

/*
 * Makes a payment details call to Adyen to confirm the current status of a payment.
   It is currently used only for PayPal Express Flow
 */
function makeExpressPaymentDetailsCall(req, res, next) {
  try {
    var request = JSON.parse(req.body);
    var currentBasket = BasketMgr.getCurrentBasket();
    var response = adyenCheckout.doPaymentsDetailsCall(request.data);
    paypalHelper.setBillingAndShippingAddress(currentBasket);

    // Setting the session variable to null after assigning the shopper data to basket level
    session.privacy.shopperDetails = null;
    var order = OrderMgr.createOrder(currentBasket, session.privacy.paypalExpressOrderNo);
    var fraudDetectionStatus = {
      status: 'success'
    };
    var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);
    if (placeOrderResult.error) {
      throw new Error('Failed to place the PayPal express order');
    }
    response.orderNo = order.orderNo;
    response.orderToken = order.orderToken;
    var paymentInstrument = order.getPaymentInstruments(AdyenHelper.getOrderMainPaymentInstrumentType(order))[0];
    // Storing the paypal express response to make use of show confirmation logic
    Transaction.wrap(function () {
      order.custom.Adyen_paypalExpressResponse = JSON.stringify(response);
      setPaymentInstrumentFields(paymentInstrument, response);
    });
    res.json({
      orderNo: response.orderNo,
      orderToken: response.orderToken
    });
    return next();
  } catch (error) {
    AdyenLogs.error_log('Could not verify express /payment/details:', error);
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}
module.exports = makeExpressPaymentDetailsCall;