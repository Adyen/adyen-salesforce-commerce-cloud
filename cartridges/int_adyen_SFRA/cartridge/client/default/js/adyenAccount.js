"use strict";

var _require = require('./commons/index'),
    onFieldValid = _require.onFieldValid,
    onBrand = _require.onBrand;

var store = require('../../../store');

var cardNode = document.getElementById('card');
store.checkoutConfiguration.amount = {
  value: 0,
  currency: 'EUR'
};
store.checkoutConfiguration.paymentMethodsConfiguration = {
  card: {
    enableStoreDetails: false,
    hasHolderName: true,
    installments: [],
    onBrand: onBrand,
    onFieldValid: onFieldValid,
    onChange: function onChange(state) {
      store.isValid = state.isValid;
      store.componentState = state;
    }
  }
};
var checkout = new AdyenCheckout(store.checkoutConfiguration);
var card = checkout.create('card').mount(cardNode);
$('button[value="add-new-payment"]').on('click', function () {
  if (store.isValid) {
    document.querySelector('#adyenStateData').value = JSON.stringify(store.componentState.data);
    return true;
  }

  card.showValidation();
  return false;
});