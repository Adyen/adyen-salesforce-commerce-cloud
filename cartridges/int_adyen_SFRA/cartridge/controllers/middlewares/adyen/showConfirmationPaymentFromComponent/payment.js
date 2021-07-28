"use strict";

var OrderMgr = require('dw/order/OrderMgr');

var Transaction = require('dw/system/Transaction');

var URLUtils = require('dw/web/URLUtils');

var Locale = require('dw/util/Locale');

var Resource = require('dw/web/Resource');

var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var OrderModel = require('*/cartridge/models/order');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

var constants = require('*/cartridge/adyenConstants/constants');

var _require = require('../../../utils/index'),
    clearForms = _require.clearForms;

function handlePaymentError(order, _ref) {
  var res = _ref.res,
      next = _ref.next;
  Transaction.wrap(function () {
    OrderMgr.failOrder(order, true);
  });
  res.redirect(URLUtils.url('Checkout-Begin', 'stage', 'placeOrder', 'paymentError', Resource.msg('error.payment.not.valid', 'checkout', null)));
  return next();
}

function handlePaymentsDetailsCall(stateData, adyenPaymentInstrument) {
  var details = stateData.details,
      paymentData = stateData.paymentData; // redirect to payment/details

  var requestObject = {
    details: details,
    paymentData: paymentData
  };
  var result = adyenCheckout.doPaymentDetailsCall(requestObject);
  return {
    result: result,
    adyenPaymentInstrument: adyenPaymentInstrument
  };
}

function handleAuthorisedPayment(order, result, adyenPaymentInstrument, _ref2) {
  var req = _ref2.req,
      res = _ref2.res,
      next = _ref2.next;
  // custom fraudDetection
  var fraudDetectionStatus = {
    status: 'success'
  }; // Places the order

  var placeOrderResult = COHelpers.placeOrder(order, fraudDetectionStatus);

  if (placeOrderResult.error) {
    return handlePaymentError(order, {
      res: res,
      next: next
    });
  }

  var currentLocale = Locale.getLocale(req.locale.id);
  var orderModel = new OrderModel(order, {
    countryCode: currentLocale.country
  }); // Save orderModel to custom object during session

  Transaction.wrap(function () {
    order.custom.Adyen_CustomerEmail = JSON.stringify(orderModel);
    AdyenHelper.savePaymentDetails(adyenPaymentInstrument, order, result);
  });
  clearForms.clearForms(); // determines SFRA version for backwards compatibility

  if (AdyenHelper.getAdyenSFRA6Compatibility() === true) {
    res.render('orderConfirmForm', {
      orderID: order.orderNo,
      orderToken: order.orderToken
    });
  } else {
    res.redirect(URLUtils.url('Order-Confirm', 'ID', order.orderNo, 'token', order.orderToken).toString());
  }

  return next();
}

function handlePayment(stateData, order, options) {
  var paymentInstruments = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT);
  var adyenPaymentInstrument = paymentInstruments[0];
  var hasStateData = (stateData === null || stateData === void 0 ? void 0 : stateData.paymentData) && (stateData === null || stateData === void 0 ? void 0 : stateData.details);

  if (!hasStateData) {
    return handlePaymentError(order, options);
  }

  var _handlePaymentsDetail = handlePaymentsDetailsCall(stateData, adyenPaymentInstrument),
      result = _handlePaymentsDetail.result;

  Transaction.wrap(function () {
    adyenPaymentInstrument.custom.adyenPaymentData = null;
  }); // Authorised: The payment authorisation was successfully completed.

  if (['Authorised', 'Pending', 'Received'].indexOf(result.resultCode) > -1) {
    return handleAuthorisedPayment(order, result, adyenPaymentInstrument, options);
  }

  return handlePaymentError(order, options);
}

module.exports = handlePayment;