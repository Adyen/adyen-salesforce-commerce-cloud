import store from "../../../../store";
import { paymentMethodsConfiguration } from "./paymentMethodsConfiguration";
const { card } = paymentMethodsConfiguration;

beforeEach(() => {
  store.checkoutConfiguration = {};
});

describe("Payment Methods Configuration", () => {
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
});
