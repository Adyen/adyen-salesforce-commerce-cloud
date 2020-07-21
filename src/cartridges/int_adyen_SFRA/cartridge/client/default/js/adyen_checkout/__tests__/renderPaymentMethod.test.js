import { renderPaymentMethod } from "../renderPaymentMethod";
import store from "../../../../../store";

let mount;
describe("Render Payment Method", () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <ul id="paymentMethodsList"></ul>
    `;
    store.componentsObj = {
      mocked_id: { node: { mocked_node: { foo: "bar" } } },
    };

    mount = jest.fn();
    store.checkout = {
      create: jest.fn(() => ({ mount })),
    };
  });
  it("should render stored payment method", () => {
    const paymentMethod = {
      id: "mocked_id",
      brand: "mocked_brand",
      name: "mocked_name",
      lastFour: "1234",
    };
    renderPaymentMethod(
      paymentMethod,
      true,
      "/mocked_path/",
      "mocked_description"
    );
    expect(mount).toBeCalledTimes(1);
    expect(document.getElementById("paymentMethodsList")).toMatchSnapshot();
    expect(store.componentsObj).toMatchSnapshot();
  });
  it("should render payment method", () => {
    const paymentMethod = {
      type: "scheme",
      name: "mocked_name",
      lastFour: "1234",
    };
    renderPaymentMethod(
      paymentMethod,
      false,
      "/mocked_path/",
      "mocked_description"
    );
    expect(document.getElementById("paymentMethodsList")).toMatchSnapshot();
    expect(store.componentsObj).toMatchSnapshot();
  });
  it("should render fallback ach payment method", () => {
    const paymentMethod = {
      type: "ach",
      name: "mocked_name",
      lastFour: "1234",
    };
    renderPaymentMethod(
      paymentMethod,
      false,
      "/mocked_path/",
      "mocked_description"
    );
    expect(mount).toBeCalledTimes(0);
    expect(document.getElementById("paymentMethodsList")).toMatchSnapshot();
  });

  it("should render fallback ratepay payment method", () => {
    const paymentMethod = {
      type: "ratepay",
      name: "mocked_name",
      lastFour: "1234",
    };
    renderPaymentMethod(
      paymentMethod,
      false,
      "/mocked_path/",
      "mocked_description"
    );
    expect(mount).toBeCalledTimes(0);
    expect(document.getElementById("paymentMethodsList")).toMatchSnapshot();
  });

  it("should handle input onChange", () => {
    document.body.innerHTML += `
      <button value="submit-payment"></button>
      <div id="component_ratepay"></div>
    `;
    const paymentMethod = {
      type: "ratepay",
      name: "mocked_name",
      lastFour: "1234",
    };
    renderPaymentMethod(
      paymentMethod,
      false,
      "/mocked_path/",
      "mocked_description"
    );
    const input = document.getElementById("rb_ratepay");
    input.onchange({ target: { value: "ratepay" } });
    expect(
      document.querySelector(`button[value="submit-payment"]`).disabled
    ).toBeFalsy();
    expect(store.selectedMethod).toBe("ratepay");
  });

  it("should handle input onChange for paypal", () => {
    document.body.innerHTML += `
      <button value="submit-payment"></button>
      <div id="component_paypal"></div>
    `;
    const paymentMethod = {
      type: "paypal",
      name: "mocked_name",
      lastFour: "1234",
    };
    renderPaymentMethod(
      paymentMethod,
      false,
      "/mocked_path/",
      "mocked_description"
    );
    const input = document.getElementById("rb_paypal");
    input.onchange({ target: { value: "paypal" } });
    expect(
      document.querySelector(`button[value="submit-payment"]`).disabled
    ).toBeTruthy();
    expect(store.selectedMethod).toBe("paypal");
  });
});
