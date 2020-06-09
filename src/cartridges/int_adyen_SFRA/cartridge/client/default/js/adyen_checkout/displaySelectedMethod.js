function displaySelectedMethod(type) {
  resetPaymentMethod();
  setSubmitButton(type);
}

function setSubmitButton(type) {
  const submitButton = document.querySelector('button[value="submit-payment"]');
  const continueButton = document.querySelector(`#continueBtn`);
  const component = document.querySelector(`#component_${type}`);

  function renderButton() {
    component.setAttribute("style", "display:block");
    submitButton.disabled = false;
    if (document.querySelector(`#continueBtn`)) {
      continueButton.setAttribute("style", "display:none");
    }
  }

  function renderPaypal() {
    submitButton.disabled = true;
    continueButton.setAttribute("style", "display:block");
  }

  type === "paypal" ? renderPaypal() : renderButton();
}

function resetPaymentMethod() {
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

module.exports = { displaySelectedMethod };
