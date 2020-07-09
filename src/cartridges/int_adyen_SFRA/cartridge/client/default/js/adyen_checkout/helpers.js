import store from "../../../../store";

export function assignPaymentMethodValue() {
  const adyenPaymentMethod = document.querySelector("#adyenPaymentMethodName");
  adyenPaymentMethod.value = document.querySelector(
    `#lb_${store.selectedMethod}`
  ).innerHTML;
}

export function paymentFromComponent(data, component) {
  $.ajax({
    url: "Adyen-PaymentFromComponent",
    type: "post",
    data: { data: JSON.stringify(data) },
    success: function (data) {
      if (data.fullResponse && data.fullResponse.action) {
        component.handleAction(data.fullResponse.action);
      } else {
        component.setStatus("ready");
        component.reject("Payment Refused");
      }
    },
  }).fail(function () {});
}

export function resetPaymentMethod() {
  $("#requiredBrandCode").hide();
  $("#selectedIssuer").val("");
  $("#adyenIssuerName").val("");
  $("#dateOfBirth").val("");
  $("#telephoneNumber").val("");
  $("#gender").val("");
  $("#bankAccountOwnerName").val("");
  $("#bankAccountNumber").val("");
  $("#bankLocationId").val("");
  $(".additionalFields").hide();
}

export function displaySelectedMethod(type) {
  store.selectedMethod = type;
  resetPaymentMethod();
  if (type !== "paypal") {
    document.querySelector('button[value="submit-payment"]').disabled = false;
  } else {
    document.querySelector('button[value="submit-payment"]').disabled = true;
  }
  document
    .querySelector(`#component_${type}`)
    .setAttribute("style", "display:block");
}

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
  return store.selectedPaymentIsValid
    ? doCustomValidation()
    : displayValidationErrors();
}
