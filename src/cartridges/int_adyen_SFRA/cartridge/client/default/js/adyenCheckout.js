import store from "../../../store";
import {
  renderGenericComponent,
  setCheckoutConfiguration,
  assignPaymentMethodValue,
  showValidation,
} from "./adyen_checkout";

$("#dwfrm_billing").submit(function (e) {
  e.preventDefault();

  const form = $(this);
  const url = form.attr("action");

  $.ajax({
    type: "POST",
    url: url,
    data: form.serialize(),
    async: false,
    success: function (data) {
      store.formErrorsExist = "fieldErrors" in data;
    },
  });
});

setCheckoutConfiguration();

if (window.installments) {
  try {
    const installments = JSON.parse(window.installments);
    store.checkoutConfiguration.paymentMethodsConfiguration.card.installments = installments;
  } catch (e) {} // eslint-disable-line no-empty
}
if (window.paypalMerchantID !== "null") {
  store.checkoutConfiguration.paymentMethodsConfiguration.paypal.merchantId =
    window.paypalMerchantID;
}

//Submit the payment
$('button[value="submit-payment"]').on("click", function () {
  if (document.querySelector("#selectedPaymentOption").value === "AdyenPOS") {
    document.querySelector("#terminalId").value = document.querySelector(
      "#terminalList"
    ).value;
    return true;
  }

  assignPaymentMethodValue();
  validateComponents();
  return showValidation();
});

function validateCustomInputField(input) {
  if (input.value === "") {
    input.classList.add("adyen-checkout__input--error");
  } else if (input.value.length > 0) {
    input.classList.remove("adyen-checkout__input--error");
  }
}

function validateComponents() {
  if (document.querySelector("#component_ach")) {
    const inputs = document.querySelectorAll("#component_ach > input");
    for (const input of inputs) {
      input.onchange = function () {
        validateCustomInputField(this);
      };
    }
  }
  if (document.querySelector("#dateOfBirthInput")) {
    document.querySelector("#dateOfBirthInput").onchange = function () {
      validateCustomInputField(this);
    };
  }

  let stateData;
  if (store.selectedPayment && store.selectedPayment.stateData) {
    stateData = store.selectedPayment.stateData;
  } else {
    stateData = { paymentMethod: { type: store.selectedMethod } };
  }

  if (store.selectedMethod === "ach") {
    const bankAccount = {
      ownerName: document.querySelector("#bankAccountOwnerNameValue").value,
      bankAccountNumber: document.querySelector("#bankAccountNumberValue")
        .value,
      bankLocationId: document.querySelector("#bankLocationIdValue").value,
    };
    stateData.paymentMethod = {
      ...stateData.paymentMethod,
      bankAccount: bankAccount,
    };
  } else if (store.selectedMethod === "ratepay") {
    if (
      document.querySelector("#genderInput").value &&
      document.querySelector("#dateOfBirthInput").value
    ) {
      stateData.shopperName = {
        gender: document.querySelector("#genderInput").value,
      };
      stateData.dateOfBirth = document.querySelector("#dateOfBirthInput").value;
    }
  }
  document.querySelector("#adyenStateData").value = JSON.stringify(stateData);
}

module.exports = {
  methods: {
    renderGenericComponent: renderGenericComponent,
  },
};
