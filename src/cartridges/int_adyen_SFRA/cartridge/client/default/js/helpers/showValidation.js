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

function isInvalid(paymentMethod) {
  return paymentMethod && !paymentMethod.isValid;
}

function displayValidationErrors(paymentMethod) {
  paymentMethod.node.showValidation();
  return false;
}

const selectedMethods = {
  ach: validateAch,
  ratepay: validateRatepay,
};

export function showValidation(componentsObj, selectedMethod) {
  const paymentMethod = componentsObj[selectedMethod];
  const doCustomValidation = () =>
    selectedMethod in selectedMethods
      ? selectedMethods[selectedMethod]()
      : true;
  return isInvalid(paymentMethod)
    ? displayValidationErrors(paymentMethod)
    : doCustomValidation();
}
