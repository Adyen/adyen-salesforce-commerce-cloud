"use strict";

var store = require('../../../../store');

function validateCustomInputField(input) {
  return input.value ? input.classList.remove('adyen-checkout__input--error') : input.classList.add('adyen-checkout__input--error');
}

function checkRatePay() {
  var hasGender = document.querySelector('#genderInput').value;
  var hasDateOfBirth = document.querySelector('#dateOfBirthInput').value;
  return hasGender && hasDateOfBirth;
}

function handleRatepay() {
  var isValid = checkRatePay();

  var setRatePay = function setRatePay() {
    store.stateData.shopperName = {
      gender: document.querySelector('#genderInput').value
    };
    store.stateData.dateOfBirth = document.querySelector('#dateOfBirthInput').value;
  };

  return isValid && setRatePay();
}

function setInputOnChange(input) {
  if (input) {
    input.onchange = function validate() {
      validateCustomInputField(this);
    };
  }
}

function validateAch() {
  var isAch = document.querySelector('#component_ach');

  var validate = function validate() {
    var inputs = document.querySelectorAll('#component_ach > input');
    inputs.forEach(setInputOnChange);
  };

  return isAch && validate();
}

function validateRatepay() {
  var input = document.querySelector('#dateOfBirthInput');
  setInputOnChange(input);
}

module.exports.validateComponents = function validateComponents() {
  validateAch();
  validateRatepay();
  var customMethods = {
    ratepay: handleRatepay
  };

  if (store.selectedMethod in customMethods) {
    customMethods[store.selectedMethod]();
  }

  document.querySelector('#adyenStateData').value = JSON.stringify(store.stateData);
};