import store from "../../../../store";

export function onFieldValid(data) {
  if (data.endDigits) {
    store.endDigits = data.endDigits;
    document.querySelector("#cardNumber").value = store.maskedCardNumber;
  }
}

export function onBrand(brandObject) {
  document.querySelector("#cardType").value = brandObject.brand;
}
