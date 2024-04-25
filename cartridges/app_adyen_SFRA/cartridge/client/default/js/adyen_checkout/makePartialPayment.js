"use strict";

var _excluded = ["giftCards"];
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
var store = require('../../../../store');
var _require = require('./renderGenericComponent'),
  initializeCheckout = _require.initializeCheckout;
var helpers = require('./helpers');
function makePartialPayment(requestData) {
  return new Promise(function (resolve, reject) {
    $.ajax({
      url: window.partialPaymentUrl,
      type: 'POST',
      data: JSON.stringify(requestData),
      contentType: 'application/json; charset=utf-8'
    }).done(function (response) {
      if (response.error) {
        reject(new Error("Partial payment error ".concat(response === null || response === void 0 ? void 0 : response.error)));
      } else {
        var giftCards = response.giftCards,
          rest = _objectWithoutProperties(response, _excluded);
        store.checkout.options.amount = rest.remainingAmount;
        store.adyenOrderData = rest.partialPaymentsOrder;
        store.partialPaymentsOrderObj = rest;
        sessionStorage.setItem('partialPaymentsObj', JSON.stringify(rest));
        store.addedGiftCards = giftCards;
        helpers.setOrderFormData(response);
        initializeCheckout();
        resolve();
      }
    }).fail(function () {
      reject(new Error('makePartialPayment request failed'));
    });
  });
}
module.exports = {
  makePartialPayment: makePartialPayment
};