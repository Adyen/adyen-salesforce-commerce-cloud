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
  it('Should handle Apple Pay errors', () => {
    document.body.innerHTML = `
        <div id="result">Apple Pay Result</div>
        <form id="showConfirmationForm"> Confirmation form</form>
      `;
    window.HTMLFormElement.prototype.submit = () => {};
    const rejectApplePay = jest.fn();
    handleError(rejectApplePay);
    expect(rejectApplePay).toBeCalledTimes(1);
  });

  it('Should authorise apple pay payment when response resultCode is Authorised', () => {
    const res = {
      resultCode: 'Authorised',
    };
    const resolveApplePay = jest.fn();
    const rejectApplePay = jest.fn();
    handleApplePayResponse(res, resolveApplePay, rejectApplePay);
    expect(resolveApplePay).toBeCalledTimes(1);
    expect(rejectApplePay).toBeCalledTimes(0);
  });

  it('Should refuse apple pay payment when response resultCode is Refused', () => {
    const res = {
      resultCode: 'Refused',
    };
    const resolveApplePay = jest.fn();
    const rejectApplePay = jest.fn();
    handleApplePayResponse(res, resolveApplePay, rejectApplePay);
    expect(resolveApplePay).toBeCalledTimes(0);
    expect(rejectApplePay).toBeCalledTimes(1);
  });

  it('Should make payment from component call', async () => {
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

  it('Should populate result to be sent to backend', async () => {
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
