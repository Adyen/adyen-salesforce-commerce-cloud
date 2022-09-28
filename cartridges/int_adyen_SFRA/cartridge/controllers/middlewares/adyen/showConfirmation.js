"use strict";

var Logger = require('dw/system/Logger');

var Transaction = require('dw/system/Transaction');

var URLUtils = require('dw/web/URLUtils');

var OrderMgr = require('dw/order/OrderMgr');

var Order = require('dw/order/Order');

var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

var constants = require('*/cartridge/adyenConstants/constants');

var payment = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/payment');

var _require = require('*/cartridge/controllers/utils/index'),
    clearForms = _require.clearForms;

var handleAuthorised = require('*/cartridge/controllers/middlewares/adyen/showConfirmation/authorise');

function getPaymentDetailsPayload(querystring) {
  var details = querystring.redirectResult ? {
    redirectResult: querystring.redirectResult
  } : {
    payload: querystring.payload
  };
  return {
    details: details
  };
}

function getPaymentsDetailsResult(adyenPaymentInstrument, redirectResult, payload, req) {
  var hasQuerystringDetails = !!(redirectResult || payload); // Saved response from Adyen-PaymentsDetails

  var result = JSON.parse(adyenPaymentInstrument.paymentTransaction.custom.Adyen_authResult);

  if (hasQuerystringDetails) {
    var requestObject = getPaymentDetailsPayload(req.querystring);
    result = adyenCheckout.doPaymentsDetailsCall(requestObject);
  }

  clearForms.clearPaymentTransactionData(adyenPaymentInstrument);
  return result;
}

function handlePaymentsDetailsResult(adyenPaymentInstrument, detailsResult, order, options) {
  if ([constants.RESULTCODES.AUTHORISED, constants.RESULTCODES.PENDING, constants.RESULTCODES.RECEIVED].indexOf(detailsResult.resultCode) > -1) {
    return handleAuthorised(adyenPaymentInstrument, detailsResult, order, options);
  }

  return payment.handlePaymentError(order, 'placeOrder', options);
}

function setPaymentMethodField(adyenPaymentInstrument, order) {
  if (adyenPaymentInstrument.custom.adyenPaymentData) {
    // Adyen_paymentMethod is used in Adyen Giving
    Transaction.wrap(function () {
      var _JSON$parse$paymentMe;

      order.custom.Adyen_paymentMethod = (_JSON$parse$paymentMe = JSON.parse(adyenPaymentInstrument.custom.adyenPaymentData).paymentMethod) === null || _JSON$parse$paymentMe === void 0 ? void 0 : _JSON$parse$paymentMe.type;
    });
  }
}

function isOrderAlreadyProcessed(order) {
  return order.status.value !== Order.ORDER_STATUS_CREATED && order.status.value !== Order.ORDER_STATUS_FAILED;
}
/*
 * Makes a payment details call to Adyen and calls for the order confirmation to be shown
 * if the payment was accepted.
 */


function showConfirmation(req, res, next) {
  var options = {
    req: req,
    res: res,
    next: next
  };
  var _req$querystring = req.querystring,
      redirectResult = _req$querystring.redirectResult,
      payload = _req$querystring.payload,
      signature = _req$querystring.signature,
      merchantReference = _req$querystring.merchantReference,
      orderToken = _req$querystring.orderToken;

  try {
    var order = OrderMgr.getOrder(merchantReference, orderToken);
    var adyenPaymentInstrument = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT)[0];

    if (isOrderAlreadyProcessed(order)) {
      Logger.getLogger('Adyen').debug('ShowConfirmation called for an order which has already been processed. This is likely to be caused by shoppers using the back button after order confirmation');
      res.redirect(URLUtils.url('Cart-Show'));
      return next();
    }

    if (adyenPaymentInstrument.paymentTransaction.custom.Adyen_merchantSig === signature) {
      if (order.status.value === Order.ORDER_STATUS_FAILED) {
        Logger.getLogger('Adyen').error("Could not call payment/details for failed order ".concat(order.orderNo));
        return payment.handlePaymentError(order, 'placeOrder', options);
      } // making sure Adyen_paymentMethod is populated before calling clearAdyenData()


      setPaymentMethodField(adyenPaymentInstrument, order);
      var detailsResult = getPaymentsDetailsResult(adyenPaymentInstrument, redirectResult, payload, req);
      return handlePaymentsDetailsResult(adyenPaymentInstrument, detailsResult, order, options);
    }

    throw new Error("Incorrect signature for order ".concat(merchantReference));
  } catch (e) {
    Logger.getLogger('Adyen').error("Could not verify /payment/details: ".concat(e.toString(), " in ").concat(e.fileName, ":").concat(e.lineNumber));
    res.redirect(URLUtils.url('Error-ErrorCode', 'err', 'general'));
    return next();
  }
}

module.exports = showConfirmation;