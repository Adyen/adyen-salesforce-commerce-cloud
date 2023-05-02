"use strict";

var _excluded = ["giftCards"];
function _objectWithoutProperties(source, excluded) { if (source == null) return {}; var target = _objectWithoutPropertiesLoose(source, excluded); var key, i; if (Object.getOwnPropertySymbols) { var sourceSymbolKeys = Object.getOwnPropertySymbols(source); for (i = 0; i < sourceSymbolKeys.length; i++) { key = sourceSymbolKeys[i]; if (excluded.indexOf(key) >= 0) continue; if (!Object.prototype.propertyIsEnumerable.call(source, key)) continue; target[key] = source[key]; } } return target; }
function _objectWithoutPropertiesLoose(source, excluded) { if (source == null) return {}; var target = {}; var sourceKeys = Object.keys(source); var key, i; for (i = 0; i < sourceKeys.length; i++) { key = sourceKeys[i]; if (excluded.indexOf(key) >= 0) continue; target[key] = source[key]; } return target; }
var store = require('../../../../store');
var _require = require('./renderGenericComponent'),
  renderGenericComponent = _require.renderGenericComponent;
var helpers = require('./helpers');
function makePartialPayment(requestData) {
  var error;
  $.ajax({
    url: 'Adyen-partialPayment',
    type: 'POST',
    data: JSON.stringify(requestData),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success: function success(response) {
      if (response.error) {
        error = {
          error: true
        };
      } else {
        var giftCards = response.giftCards,
          rest = _objectWithoutProperties(response, _excluded);
        store.checkout.options.amount = rest.remainingAmount;
        store.partialPaymentsOrderObj = rest;
        sessionStorage.setItem('partialPaymentsObj', JSON.stringify(rest));
        store.addedGiftCards = giftCards;
        helpers.setOrderFormData(response);
        renderGenericComponent(true);
      }
    }
  }).fail(function () {});
  return error;
}
module.exports = {
  makePartialPayment: makePartialPayment
};