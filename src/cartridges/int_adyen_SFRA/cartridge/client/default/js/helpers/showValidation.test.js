const { showValidation } = require("./showValidation");

const mockedComponentsObj = {
  mockedValid: {
    isValid: true,
  },
  mockedInvalid: {
    isValid: false,
  },
};

describe("Show Validation", () => {
  it("should return true if valid", () => {
    const result = showValidation(mockedComponentsObj, "mockedValid");
    expect(result).toBeTruthy();
  });
  it("should return true if selected method is not found", () => {
    const result = showValidation(mockedComponentsObj, "someRandomPM");
    expect(result).toBeTruthy();
  });
  it("should return false if invalid", () => {
    const spy = jest.fn();
    mockedComponentsObj.mockedInvalid.node = { showValidation: spy };
    const result = showValidation(mockedComponentsObj, "mockedInvalid");
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
    const result = showValidation(mockedComponentsObj, "ach");
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
    const result = showValidation(mockedComponentsObj, "ach");
    const errors = document.querySelectorAll(".adyen-checkout__input--error");
    expect(result).toBeFalsy();
    expect(errors).toHaveLength(2);
  });
  it("should return false if it's ratepay without date of birth", () => {
    const mockedRatePay = `
      <input id="dateOfBirthInput" value="" />
    `;
    document.body.innerHTML = mockedRatePay;
    const result = showValidation(mockedComponentsObj, "ratepay");
    const errors = document.querySelectorAll(".adyen-checkout__input--error");
    expect(result).toBeFalsy();
    expect(errors).toHaveLength(1);
  });
  it("should return true if it's ratepay with date of birth", () => {
    const mockedRatePay = `
      <input id="dateOfBirthInput" value="01011990" />
    `;
    document.body.innerHTML = mockedRatePay;
    const result = showValidation(mockedComponentsObj, "ratepay");
    const errors = document.querySelectorAll(".adyen-checkout__input--error");
    expect(result).toBeTruthy();
    expect(errors).toHaveLength(0);
  });
});
