import store from "../../../../store";

function showInputError(input) {
  input.classList.add("adyen-checkout__input--error");
}
function validateAch() {
  const inputs = document.querySelectorAll("#component_ach > input");
  const filteredInputs = Object.values(inputs).filter(
    ({ value }) => !value?.length
  );
  filteredInputs.forEach(showInputError);

  return !filteredInputs.length;
}

function validateRatepay() {
  const input = document.querySelector("#dateOfBirthInput");
  const inputIsFilled = input.value?.length;
  if (!inputIsFilled) {
    showInputError(input);
  }
  return !!inputIsFilled;
}

function isInvalid() {
  return store.selectedPayment && !store.selectedPayment.isValid;
}

function displayValidationErrors() {
  store.selectedPayment.node.showValidation();
  return false;
}

const selectedMethods = {
  ach: validateAch,
  ratepay: validateRatepay,
};

export function showValidation() {
  const doCustomValidation = () =>
    store.selectedMethod in selectedMethods
      ? selectedMethods[store.selectedMethod]()
      : true;
  return isInvalid() ? displayValidationErrors() : doCustomValidation();
}
