import { showValidation } from "./showValidation";
import store from "../../../../store";

store.componentsObj = {
  mockedValid: {
    isValid: true,
  },
  mockedInvalid: {
    isValid: false,
  },
};

describe("Show Validation", () => {
  it("should return true if valid", () => {
    store.selectedMethod = "mockedValid";
    const result = showValidation();
    expect(result).toBeTruthy();
  });
  it("should return true if selected method is not found", () => {
    const result = showValidation("someRandomPM");
    expect(result).toBeTruthy();
  });
  it("should return false if invalid", () => {
    const spy = jest.fn();
    store.componentsObj.mockedInvalid.node = { showValidation: spy };
    store.selectedMethod = "mockedInvalid";
    const result = showValidation();
    expect(spy).toHaveBeenCalled();
    expect(result).toBeFalsy();
  });
  it("should return true if it's ach and there is no input error", () => {
    const mockedAch = `
      <div id="component_ach">
        <input value="ok" />
      </div>
    `;
    document.body.innerHTML = mockedAch;
    store.selectedMethod = "ach";
    const result = showValidation();
    const errors = document.querySelectorAll(".adyen-checkout__input--error");
    expect(result).toBeTruthy();
    expect(errors).toHaveLength(0);
  });
  it("should return false if it's ach and there is input errors", () => {
    const mockedAch = `
      <div id="component_ach">
        <input value="" />
        <input value="" />
      </div>
    `;
    document.body.innerHTML = mockedAch;
    store.selectedMethod = "ach";
    const result = showValidation();
    const errors = document.querySelectorAll(".adyen-checkout__input--error");
    expect(result).toBeFalsy();
    expect(errors).toHaveLength(2);
  });
  it("should return false if it's ratepay without date of birth", () => {
    const mockedRatePay = `
      <input id="dateOfBirthInput" value="" />
    `;
    document.body.innerHTML = mockedRatePay;
    store.selectedMethod = "ratepay";
    const result = showValidation();
    const errors = document.querySelectorAll(".adyen-checkout__input--error");
    expect(result).toBeFalsy();
    expect(errors).toHaveLength(1);
  });
  it("should return true if it's ratepay with date of birth", () => {
    const mockedRatePay = `
      <input id="dateOfBirthInput" value="01011990" />
    `;
    document.body.innerHTML = mockedRatePay;
    store.selectedMethod = "ratepay";
    const result = showValidation();
    const errors = document.querySelectorAll(".adyen-checkout__input--error");
    expect(result).toBeTruthy();
    expect(errors).toHaveLength(0);
  });
});
