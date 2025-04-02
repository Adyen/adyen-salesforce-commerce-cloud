"use strict";

var URLUtils = require('dw/web/URLUtils');
var OrderMgr = require('dw/order/OrderMgr');
var Transaction = require('dw/system/Transaction');
var BasketMgr = require('dw/order/BasketMgr');
var adyenCheckout = require('*/cartridge/adyen/scripts/payments/adyenCheckout');
var AdyenLogs = require('*/cartridge/adyen/logs/adyenCustomLogs');
var AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
var constants = require('*/cartridge/adyen/config/constants');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
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
    var request = JSON.parse(req.form.data);
    var currentBasket = BasketMgr.getCurrentBasket();
    var productLines = currentBasket.getAllProductLineItems().toArray();
    var productQuantity = currentBasket.getProductQuantityTotal();
    var hashedProducts = AdyenHelper.getAdyenHash(productLines, productQuantity);
    if (hashedProducts !== currentBasket.custom.adyenProductLineItems) {
      throw new Error('Basket products changed, cannot complete trasaction');
    }
    var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', currentBasket,
    // eslint-disable-next-line global-require
    require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
    if (validationOrderStatus.error) {
      throw new Error(validationOrderStatus.message);
    }

    // create order
    var order = null;
    Transaction.wrap(function () {
      order = OrderMgr.createOrder(currentBasket, session.privacy.paypalExpressOrderNo);
    });
    if (!order) {
      throw new Error('Order could not be created for paypal express');
    }
    var response = adyenCheckout.doPaymentsDetailsCall(request.data);
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