"use strict";

function _typeof(obj) { "@babel/helpers - typeof"; return _typeof = "function" == typeof Symbol && "symbol" == typeof Symbol.iterator ? function (obj) { return typeof obj; } : function (obj) { return obj && "function" == typeof Symbol && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }, _typeof(obj); }

var _require = require('./commons/index'),
    onFieldValid = _require.onFieldValid,
    onBrand = _require.onBrand;

var store = require('../../../store');

var checkout; // Store configuration

store.checkoutConfiguration.amount = {
  value: 0,
  currency: 'EUR'
};
store.checkoutConfiguration.paymentMethodsConfiguration = {
  card: {
    enableStoreDetails: false,
    hasHolderName: true,
    holderNameRequired: true,
    installments: [],
    onBrand: onBrand,
    onFieldValid: onFieldValid,
    onChange: function onChange(state) {
      store.isValid = state.isValid;
      store.componentState = state;
    }
  }
}; // Handle Payment action

function handleAction(action) {
  checkout.createFromAction(action).mount('#action-container');
  $('#action-modal').modal({
    backdrop: 'static',
    keyboard: false
  });
} // confirm onAdditionalDetails event and paymentsDetails response


store.checkoutConfiguration.onAdditionalDetails = function (state) {
  $.ajax({
    type: 'POST',
    url: 'Adyen-PaymentsDetails',
    data: JSON.stringify(state.data),
    contentType: 'application/json; charset=utf-8',
    async: false,
    success: function success(data) {
      if (data.isSuccessful) {
        window.location.href = window.redirectUrl;
      } else if (!data.isFinal && _typeof(data.action) === 'object') {
        handleAction(data.action);
      } else {
        $('#action-modal').modal('hide');
        document.getElementById('cardError').style.display = 'block';
      }
    }
  });
}; // card and checkout component creation


var cardNode = document.getElementById('card');
checkout = new AdyenCheckout(store.checkoutConfiguration);
var card = checkout.create('card').mount(cardNode);
var formErrorsExist = false;

function submitAddCard() {
  var form = $(document.getElementById('payment-form'));
  $.ajax({
    type: 'POST',
    url: form.attr('action'),
    data: form.serialize(),
    async: false,
    success: function success(data) {
      if (data.redirectAction) {
        handleAction(data.redirectAction);
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else if (data.error) {
        formErrorsExist = true;
      }
    }
  });
} // Add Payment Button event handler


$('button[value="add-new-payment"]').on('click', function (event) {
  if (store.isValid) {
    document.querySelector('#adyenStateData').value = JSON.stringify(store.componentState.data);
    submitAddCard();

    if (formErrorsExist) {
      return;
    }

    event.preventDefault();
  } else {
    card.showValidation();
  }
});