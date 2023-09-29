"use strict";

/* API Includes */
var PaymentMgr = require('dw/order/PaymentMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var constants = require('*/cartridge/adyenConstants/constants');

/* Script Modules */
var app = require(Resource.msg('scripts.app.js', 'require', null));
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var adyenRemovePreviousPI = require('*/cartridge/scripts/adyenRemovePreviousPI');
var AdyenLogs = require('*/cartridge/scripts/adyenCustomLogs');

/**
 * Creates a Adyen payment instrument for the given basket
 */
function Handle(args) {
  var currentBasket = args.Basket;
  var paymentInformation = app.getForm('adyPaydata');
  Transaction.wrap(function () {
    var result = adyenRemovePreviousPI.removePaymentInstruments(currentBasket);
    if (result.error) {
      return result;
    }
    var paymentInstrument = currentBasket.createPaymentInstrument(constants.METHOD_ADYEN_COMPONENT, currentBasket.totalGrossPrice);
    paymentInstrument.custom.adyenPaymentData = paymentInformation.get('adyenStateData').value();
    session.privacy.adyenFingerprint = paymentInformation.get('adyenFingerprint').value();
  });
  return {
    success: true
  };
}

/**
 * Call the  Adyen API to Authorize CC using details entered by shopper.
 */
function Authorize(args) {
  var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
  var order = args.Order;
  var paymentInstrument = args.PaymentInstrument;
  var paymentProcessor = PaymentMgr.getPaymentMethod(paymentInstrument.getPaymentMethod()).getPaymentProcessor();
  Transaction.begin();
  paymentInstrument.paymentTransaction.paymentProcessor = paymentProcessor;
  var orderCustomer = order.getCustomer();
  var sessionCustomer = session.getCustomer();
  if (orderCustomer.authenticated && orderCustomer.ID !== sessionCustomer.ID) {
    AdyenLogs.debug_log('orderCustomer is not the same as the sessionCustomer');
    Transaction.wrap(function () {
      OrderMgr.failOrder(order, true);
    });
    return {
      isAdyen: true,
      error: true,
      PlaceOrderError: 'orderCustomer is not the same as the sessionCustomer'
    };
  }
  var result = adyenCheckout.createPaymentRequest({
    Order: order,
    PaymentInstrument: paymentInstrument
  });
  if (result.error) {
    Transaction.rollback();
    var _args = 'args' in result ? result.args : null;
    return {
      isAdyen: true,
      error: true,
      PlaceOrderError: !empty(_args) && 'AdyenErrorMessage' in _args && !empty(_args.AdyenErrorMessage) ? _args.AdyenErrorMessage : ''
    };
  }
  if (result.pspReference) {
    order.custom.Adyen_pspReference = result.pspReference;
  }
  var checkoutResponse = AdyenHelper.createAdyenCheckoutResponse(result);
  if (!checkoutResponse.isFinal) {
    checkoutResponse.isAdyen = true;
    checkoutResponse.orderToken = order.orderToken;
    return checkoutResponse;
  }
  if (!checkoutResponse.isSuccessful) {
    Transaction.rollback();
    return {
      isAdyen: true,
      error: true,
      PlaceOrderError: 'AdyenErrorMessage' in result && !empty(result.adyenErrorMessage) ? result.adyenErrorMessage : ''
    };
  }
  AdyenHelper.savePaymentDetails(paymentInstrument, order, result);
  Transaction.commit();
  return {
    isAdyen: true,
    authorized: true,
    error: false
  };
}
exports.Handle = Handle;
exports.Authorize = Authorize;