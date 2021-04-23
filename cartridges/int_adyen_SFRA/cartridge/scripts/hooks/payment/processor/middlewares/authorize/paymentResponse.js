"use strict";

var Transaction = require('dw/system/Transaction');

var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

function get3DS2Response(result) {
  return {
    threeDS2: result.threeDS2,
    resultCode: result.resultCode,
    action: JSON.stringify(result.fullResponse.action)
  };
}

function getRedirectResponse(result, orderNumber, paymentInstrument) {
  var _result$redirectObjec, _result$redirectObjec2;

  var createHash = function createHash(substr) {
    return AdyenHelper.getAdyenHash(result.redirectObject.url.substr(result.redirectObject.url.length - 25), substr);
  }; // Signature for 3DS payments


  var getMDSignature = function getMDSignature() {
    return createHash(result.redirectObject.data.MD.substr(1, 25));
  }; // Signature for redirect methods


  var getPaymentDataSignature = function getPaymentDataSignature() {
    return createHash(result.paymentData.substr(1, 25));
  };

  var hasMD = !!((_result$redirectObjec = result.redirectObject) !== null && _result$redirectObjec !== void 0 && (_result$redirectObjec2 = _result$redirectObjec.data) !== null && _result$redirectObjec2 !== void 0 && _result$redirectObjec2.MD); // If the response has MD, then it is a 3DS transaction

  var signature = hasMD ? getMDSignature() : getPaymentDataSignature();
  return {
    authorized: true,
    authorized3d: hasMD,
    orderNo: orderNumber,
    paymentInstrument: paymentInstrument,
    redirectObject: result.redirectObject,
    signature: signature
  };
}

function paymentResponseHandler(paymentInstrument, result, orderNumber) {
  paymentInstrument.custom.adyenPaymentData = result.paymentData;
  Transaction.commit();
  return result.threeDS2 ? get3DS2Response(result) : getRedirectResponse(result, orderNumber, paymentInstrument);
}

module.exports = paymentResponseHandler;