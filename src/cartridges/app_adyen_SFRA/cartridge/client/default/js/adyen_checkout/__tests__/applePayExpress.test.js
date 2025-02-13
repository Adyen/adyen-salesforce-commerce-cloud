/**
 * @jest-environment jsdom
 */
let response;
const {
  handleAuthorised,
  handleError,
  handleApplePayResponse,
  callPaymentFromComponent,
  formatCustomerObject,
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

  it('Should format customer and billing data correctly', () => {
    const customerData = {
      addressLines: ['123 Main St', 'Apt 2'],
      locality: 'City',
      country: 'United States',
      countryCode: 'US',
      givenName: 'John',
      familyName: 'Doe',
      emailAddress: 'john@example.com',
      postalCode: '12345',
      administrativeArea: 'State',
      phoneNumber: '+1234567890',
    };
    const billingData = {
      addressLines: ['456 Oak St'],
      locality: 'Town',
      country: 'United States',
      countryCode: 'US',
      givenName: 'Jane',
      familyName: 'Doe',
      postalCode: '54321',
      administrativeArea: 'Province',
    };
    const formattedData = formatCustomerObject(customerData, billingData);
    expect(formattedData).toEqual({
      addressBook: {
        addresses: {},
        preferredAddress: {
          address1: '123 Main St',
          address2: 'Apt 2',
          city: 'City',
          countryCode: {
            displayValue: 'United States',
            value: 'US',
          },
          firstName: 'John',
          lastName: 'Doe',
          ID: 'john@example.com',
          postalCode: '12345',
          stateCode: 'State',
        },
      },
      billingAddressDetails: {
        address1: '456 Oak St',
        address2: null,
        city: 'Town',
        countryCode: {
          displayValue: 'United States',
          value: 'US',
        },
        firstName: 'Jane',
        lastName: 'Doe',
        postalCode: '54321',
        stateCode: 'Province',
      },
      customer: {},
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        phone: '+1234567890',
      },
    });
  });
});
