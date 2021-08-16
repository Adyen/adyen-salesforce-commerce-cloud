"use strict";

var Resource = require('dw/web/Resource');

var URLUtils = require('dw/web/URLUtils');

var Transaction = require('dw/system/Transaction');

var constants = require('*/cartridge/adyenConstants/constants');

var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');

function handlePaymentAuthorization(order, _ref, emit) {
  var res = _ref.res;

  var handleRedirectResult = function handleRedirectResult(handlePaymentResult) {
    var paymentInstrument = order.getPaymentInstruments(constants.METHOD_ADYEN_COMPONENT)[0];

    if (handlePaymentResult.threeDS2) {
      Transaction.wrap(function () {
        paymentInstrument.custom.adyenAction = handlePaymentResult.action;
      });
      res.json({
        error: false,
        order: order,
        continueUrl: URLUtils.url('Adyen-Adyen3DS2', 'resultCode', handlePaymentResult.resultCode, 'orderNo', order.orderNo).toString()
      });
      emit('route:Complete');
      return false;
    }

    if (handlePaymentResult.redirectObject) {
      // If authorized3d, then redirectObject from credit card, hence it is 3D Secure
      if (handlePaymentResult.authorized3d) {
        Transaction.wrap(function () {
          paymentInstrument.custom.adyenMD = handlePaymentResult.redirectObject.data.MD;
        });
        res.json({
          error: false,
          continueUrl: URLUtils.url('Adyen-Adyen3D', 'IssuerURL', handlePaymentResult.redirectObject.url, 'PaRequest', handlePaymentResult.redirectObject.data.PaReq, 'MD', handlePaymentResult.redirectObject.data.MD, 'merchantReference', handlePaymentResult.orderNo, 'signature', handlePaymentResult.signature).toString()
        });
        emit('route:Complete');
        return false;
      }

      Transaction.wrap(function () {
        paymentInstrument.custom.adyenRedirectURL = handlePaymentResult.redirectObject.url;
      });
      res.json({
        error: false,
        continueUrl: URLUtils.url('Adyen-Redirect', 'merchantReference', handlePaymentResult.orderNo, 'signature', handlePaymentResult.signature).toString()
      });
      emit('route:Complete');
      return false;
    }

    return true;
  }; // Handles payment authorization


  var handlePaymentResult = adyenHelpers.handlePayments(order, order.orderNo);

  if (handlePaymentResult.error) {
    res.json({
      error: true,
      errorMessage: Resource.msg('error.payment.not.valid', 'checkout', null)
    });
    emit('route:Complete');
    return false;
  }

  return handleRedirectResult(handlePaymentResult);
}

module.exports = handlePaymentAuthorization;