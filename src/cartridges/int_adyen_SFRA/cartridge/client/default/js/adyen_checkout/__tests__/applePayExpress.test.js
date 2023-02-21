/**
 * @jest-environment jsdom
 */
let response;
const {
  handleAuthorised,
  handleError,
  handleApplePayResponse,
  callPaymentFromComponent,
} = require('../../applePayExpress');

beforeEach(() => {
  jest.clearAllMocks();

  response = {
    fullResponse: {
      pspReference: 'mocked_psp',
      resultCode: 'mocked_resultCode',
      paymentMethod: 'mocked_paymentMethod',
    },
  };
});

afterEach(() => {
    jest.resetModules();
  });

describe('Apple Pay Express', () => {
  it('Apple Pay handleError', () => {
    document.body.innerHTML = `
        <div id="result">Apple Pay Result</div>
        <form id="showConfirmationForm"> Confirmation form</form>
      `;
    window.HTMLFormElement.prototype.submit = () => {};
    const rejectApplePay = jest.fn();
    handleError(rejectApplePay);
    expect(rejectApplePay).toBeCalledTimes(1);
  });

  it('Apple Pay handleAuthorize should resolve', () => {
    const res = {
      resultCode: 'Authorised',
    };
    const resolveApplePay = jest.fn();
    const rejectApplePay = jest.fn();
    handleApplePayResponse(res, resolveApplePay, rejectApplePay);
    expect(resolveApplePay).toBeCalledTimes(1);
    expect(rejectApplePay).toBeCalledTimes(0);
  });

  it('Apple Pay handleAuthorize should reject', () => {
    const res = {
      resultCode: 'Refused',
    };
    const resolveApplePay = jest.fn();
    const rejectApplePay = jest.fn();
    handleApplePayResponse(res, resolveApplePay, rejectApplePay);
    expect(resolveApplePay).toBeCalledTimes(0);
    expect(rejectApplePay).toBeCalledTimes(1);
  });

  it('Apple Pay callPaymentFromComponent', async () => {
    document.body.innerHTML = `
        <div id="result"></div>
        <form id="showConfirmationForm">
            <input id="additionalDetailsHidden"/>
        </form>
      `;
    const data = JSON.stringify({
      additionalDetailsHidden: {
        paymentData: 'mocked_paymentData',
        details: 'mocked_details',
      },
    });
    $.ajax = jest.fn(({ success }) => {
      success(data);
      return { fail: jest.fn() };
    });
    const resolveApplePay = jest.fn();
    const rejectApplePay = jest.fn();
    await callPaymentFromComponent(data, resolveApplePay, rejectApplePay);
    expect(document.getElementById('additionalDetailsHidden').value).toBe(
      JSON.stringify(data),
    );
  });

  it('Apple Pay handleAuthorized', async () => {
    document.body.innerHTML = `
        <div id="result"></div>
        <form id="showConfirmationForm">
            <input id="additionalDetailsHidden"/>
        </form>
      `;
    const resolveApplePay = jest.fn();
    handleAuthorised(response, resolveApplePay);
    expect(document.getElementById('result').value).toBe(
      JSON.stringify(response.fullResponse),
    );
  });
});