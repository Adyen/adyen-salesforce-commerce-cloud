import store from "../../../../store";
import { getCardConfig, getPaypalConfig } from "./checkoutConfiguration";

let card;
let paypal;
beforeEach(() => {
  window.Configuration = { environment: "TEST" };
  store.checkoutConfiguration = {};
  card = getCardConfig();
  paypal = getPaypalConfig();
});

describe("Checkout Configuration", () => {
  describe("Card", () => {
    it("handles onChange", () => {
      store.selectedMethod = "scheme";
      store.componentsObj = { scheme: {} };
      const data = { paymentMethod: { type: "scheme" } };
      card.onChange({ isValid: true, data });
      expect(store.selectedPayment.isValid).toBeTruthy();
    });
    it("handles onFieldValid", () => {
      const mockedInput = "<input id='cardNumber' />";
      document.body.innerHTML = mockedInput;

      card.onFieldValid({ endDigits: 4444 });
      const cardNumber = document.querySelector("#cardNumber");
      expect(cardNumber.value).toEqual("************4444");
    });
    it("handles onBrand", () => {
      const mockedInput = "<input id='cardType' />";
      document.body.innerHTML = mockedInput;

      card.onBrand({ brand: "visa" });
      const cardType = document.querySelector("#cardType");
      expect(cardType.value).toEqual("visa");
    });
  });
  describe("PayPal", () => {
    it("handles onSubmit", () => {
      document.body.innerHTML = `
        <div id="lb_paypal">PayPal</div>
        <div id="adyenPaymentMethodName"></div>
        <div id="adyenStateData"></div>
      `;
      store.selectedMethod = "paypal";
      store.componentsObj = { paypal: { stateData: { foo: "bar" } } };
      paypal.onSubmit({ data: {} });
      expect(document.getElementById("adyenStateData").value).toBe(
        JSON.stringify(store.selectedPayment.stateData)
      );
    });
  });
});
