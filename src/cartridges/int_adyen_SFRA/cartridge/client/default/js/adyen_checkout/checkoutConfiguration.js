import store from "../../../../store";
import { assignPaymentMethodValue, paymentFromComponent } from "./index";
import { onBrand, onFieldValid } from "../commons";

function getComponentName(data) {
  return data.paymentMethod.storedPaymentMethodId
    ? `storedCard${data.paymentMethod.storedPaymentMethodId}`
    : data.paymentMethod.type;
}

export function getCardConfig() {
  return {
    enableStoreDetails: showStoreDetails,
    onChange(state) {
      store.isValid = state.isValid;
      const isSelected = getComponentName(state.data) === store.selectedMethod;
      if (isSelected) {
        store.updateSelectedPayment("isValid", store.isValid);
        store.updateSelectedPayment("stateData", state.data);
      }
    },
    onFieldValid,
    onBrand,
  };
}

export function getPaypalConfig() {
  return {
    environment: window.Configuration.environment,
    intent: "capture",
    onSubmit: (state, component) => {
      assignPaymentMethodValue();
      document.querySelector("#adyenStateData").value = JSON.stringify(
        store.selectedPayment.stateData
      );

      paymentFromComponent(state.data, component);
    },
    onCancel: (data, component) => {
      paymentFromComponent({ cancelTransaction: true }, component);
      component.setStatus("ready");
    },
    onError: (error, component) => {
      if (component) {
        component.setStatus("ready");
      }
    },
    onAdditionalDetails: (state) => {
      document.querySelector("#additionalDetailsHidden").value = JSON.stringify(
        state.data
      );
      document.querySelector("#showConfirmationForm").submit();
    },
    onClick: (data, actions) => {
      $("#dwfrm_billing").trigger("submit");
      if (store.formErrorsExist) {
        return actions.reject();
      }
    },
  };
}

export function handleOnChange(state) {
  const { type } = state.data.paymentMethod;
  store.isValid = state.isValid;
  if (!store.componentsObj[type]) {
    store.componentsObj[type] = {};
  }
  store.componentsObj[type].isValid = store.isValid;
  store.componentsObj[type].stateData = state.data;
}

export function setCheckoutConfiguration() {
  store.checkoutConfiguration.onChange = handleOnChange;
  store.checkoutConfiguration.showPayButton = false;

  store.checkoutConfiguration.paymentMethodsConfiguration = {
    card: getCardConfig(),
    boletobancario: {
      personalDetailsRequired: true, // turn personalDetails section on/off
      billingAddressRequired: false, // turn billingAddress section on/off
      showEmailAddress: false, // allow shopper to specify their email address

      // Optionally prefill some fields, here all fields are filled:
      data: {
        firstName: document.getElementById("shippingFirstNamedefault").value,
        lastName: document.getElementById("shippingLastNamedefault").value,
      },
    },
    paypal: getPaypalConfig(),
    afterpay_default: {
      visibility: {
        personalDetails: "editable",
        billingAddress: "hidden",
        deliveryAddress: "hidden",
      },
      data: {
        personalDetails: {
          firstName: document.querySelector("#shippingFirstNamedefault").value,
          lastName: document.querySelector("#shippingLastNamedefault").value,
          telephoneNumber: document.querySelector("#shippingPhoneNumberdefault")
            .value,
          shopperEmail: document.querySelector("#email").value,
        },
      },
    },
    facilypay_3x: {
      visibility: {
        personalDetails: "editable",
        billingAddress: "hidden",
        deliveryAddress: "hidden",
      },
      data: {
        personalDetails: {
          firstName: document.querySelector("#shippingFirstNamedefault").value,
          lastName: document.querySelector("#shippingLastNamedefault").value,
          telephoneNumber: document.querySelector("#shippingPhoneNumberdefault")
            .value,
          shopperEmail: document.querySelector("#email").value,
        },
      },
    },
  };
}
