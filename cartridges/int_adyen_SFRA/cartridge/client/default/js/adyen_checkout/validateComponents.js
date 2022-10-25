"use strict";

var store = require('../../../../store');
module.exports.validateComponents = function validateComponents() {
  var customMethods = {};
  if (store.selectedMethod in customMethods) {
    customMethods[store.selectedMethod]();
  }
  document.querySelector('#adyenStateData').value = JSON.stringify(store.stateData);
  if (store.partialPaymentsOrderObj) {
    document.querySelector('#adyenPartialPaymentsOrder').value = JSON.stringify(store.partialPaymentsOrderObj);
  }
};