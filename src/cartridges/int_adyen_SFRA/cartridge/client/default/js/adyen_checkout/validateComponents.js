const store = require('../../../../store');

function validateCustomInputField(input) {
  return input.value
    ? input.classList.remove('adyen-checkout__input--error')
    : input.classList.add('adyen-checkout__input--error');
}

function handleAch() {
  const bankAccount = {
    ownerName: document.querySelector('#bankAccountOwnerNameValue').value,
    bankAccountNumber: document.querySelector('#bankAccountNumberValue').value,
    bankLocationId: document.querySelector('#bankLocationIdValue').value,
  };
  store.stateData.paymentMethod = {
    ...store.stateData.paymentMethod,
    bankAccount,
  };
}

function checkRatePay() {
  const hasGender = document.querySelector('#genderInput').value;
  const hasDateOfBirth = document.querySelector('#dateOfBirthInput').value;
  return hasGender && hasDateOfBirth;
}

function handleRatepay() {
  const isValid = checkRatePay();
  const setRatePay = () => {
    store.stateData.shopperName = {
      gender: document.querySelector('#genderInput').value,
    };
    store.stateData.dateOfBirth = document.querySelector(
      '#dateOfBirthInput',
    ).value;
  };
  if (isValid) {
    setRatePay();
  }
}

function setInputOnChange() {
  if (this) {
    this.onchange = function validate() {
      validateCustomInputField(this);
    };
  }
}

function validateAch() {
  const isAch = document.querySelector('#component_ach');
  const validate = () => {
    const inputs = document.querySelectorAll('#component_ach > input');
    inputs.forEach((input) => setInputOnChange.call(input));
  };
  if (isAch) {
    validate();
  }
}

function validateRatepay() {
  const input = document.querySelector('#dateOfBirthInput');
  setInputOnChange.call(input);
}

module.exports.validateComponents = function validateComponents() {
  validateAch();
  validateRatepay();

  const customMethods = {
    ach: handleAch,
    ratepay: handleRatepay,
  };

  if (store.selectedMethod in customMethods) {
    customMethods[store.selectedMethod]();
  }

  document.querySelector('#adyenStateData').value = JSON.stringify(
    store.stateData,
  );
};
