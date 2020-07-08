import store from "../../../../store";

function getComponentName(data) {
  return data.paymentMethod.storedPaymentMethodId
    ? `storedCard${data.paymentMethod.storedPaymentMethodId}`
    : data.paymentMethod.type;
}

const cardConfig = {
  enableStoreDetails: showStoreDetails,
  onChange: function (state) {
    store.isValid = state.isValid;
    const isSelected = getComponentName(state.data) === store.selectedMethod;
    if (isSelected) {
      store.updateSelectedPayment("isValid", store.isValid);
      store.updateSelectedPayment("stateData", state.data);
    }
  },
  onFieldValid: function (data) {
    if (data.endDigits) {
      store.endDigits = data.endDigits;
      document.querySelector("#cardNumber").value = store.maskedCardNumber;
    }
  },
  onBrand: function (brandObject) {
    document.querySelector("#cardType").value = brandObject.brand;
  },
};
export const paymentMethodsConfiguration = {
  card: cardConfig,
};
