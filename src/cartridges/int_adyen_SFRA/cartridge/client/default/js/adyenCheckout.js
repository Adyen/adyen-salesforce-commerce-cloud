import store from "../../../store";
import {
  renderGenericComponent,
  setCheckoutConfiguration,
  assignPaymentMethodValue,
  showValidation,
  validateComponents,
} from "./adyen_checkout";

$("#dwfrm_billing").submit(function (e) {
  e.preventDefault();

  const form = $(this);
  const url = form.attr("action");

  $.ajax({
    type: "POST",
    url,
    data: form.serialize(),
    async: false,
    success(data) {
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

// Submit the payment
$('button[value="submit-payment"]').on("click", () => {
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

/**
 * Assigns stateData value to the hidden stateData input field so it's sent to the backend for processing
 */
export const methods = { renderGenericComponent };
