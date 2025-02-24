"use strict";

var _excluded = ["giftCards"];
function _objectWithoutProperties(e, t) { if (null == e) return {}; var o, r, i = _objectWithoutPropertiesLoose(e, t); if (Object.getOwnPropertySymbols) { var n = Object.getOwnPropertySymbols(e); for (r = 0; r < n.length; r++) o = n[r], -1 === t.indexOf(o) && {}.propertyIsEnumerable.call(e, o) && (i[o] = e[o]); } return i; }
function _objectWithoutPropertiesLoose(r, e) { if (null == r) return {}; var t = {}; for (var n in r) if ({}.hasOwnProperty.call(r, n)) { if (-1 !== e.indexOf(n)) continue; t[n] = r[n]; } return t; }
var store = require('../../../../store');
var _require = require('./renderGenericComponent'),
  initializeCheckout = _require.initializeCheckout;
var helpers = require('./helpers');
function makePartialPayment(requestData) {
  return new Promise(function (resolve, reject) {
    $.ajax({
      url: window.partialPaymentUrl,
      type: 'POST',
      data: {
        csrf_token: $('#adyen-token').val(),
        data: JSON.stringify(requestData)
      }
    }).done(function (response) {
      if (response.error) {
        reject(new Error("Partial payment error ".concat(response === null || response === void 0 ? void 0 : response.error)));
      } else {
        var giftCards = response.giftCards,
          rest = _objectWithoutProperties(response, _excluded);
        store.checkout.options.amount = rest.remainingAmount;
        store.adyenOrderDataCreated = rest.orderCreated;
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