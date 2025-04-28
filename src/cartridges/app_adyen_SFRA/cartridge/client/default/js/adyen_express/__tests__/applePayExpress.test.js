/**
 * @jest-environment ./jest/customJsdomEnvironment.js
 */

const ApplePay = require('../paymentMethods/applepay/applepay');
const store = require('../../../../../../cartridge/config/store');
const helpers = require('../../../js/adyen/checkout/helpers');

jest.mock('../../../js/commons/httpClient');
jest.mock('../../../../../../cartridge/config/store');
jest.mock('../../../js/adyen/checkout/helpers');
jest.mock('../initializeCheckout');
jest.mock('../../commons');

describe('ApplePay class', () => {
  let applePay;

  beforeEach(() => {
    jest.resetAllMocks();
    Object.defineProperty(global, 'window', {
      value: {
        AdyenWeb: {
          AdyenCheckout: jest.fn(),
          createComponent: jest.fn().mockImplementation(() => {})
        },
        basketAmount: JSON.stringify({ value: 100, currency: 'USD' }),
        showConfirmationAction: true,
        shippingMethodsUrl: 'https://example.com/shipping-methods',
        selectShippingMethodUrl: 'https://example.com/select-shipping-method',
        paymentFromComponentURL: 'https://example.com/payment-from-component',
      },
      writable: true,
    });
    applePay = new ApplePay(
      { merchantName: 'Test Merchant' },
      { applicationInfo: 'Test Info' },
      { 'en-US': {} },
      true,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should initialize correctly', () => {
    expect(applePay.store).toBe(store);
    expect(applePay.helpers).toBe(helpers);
    expect(applePay.amount).toEqual({ value: 100, currency: 'USD' });
    expect(applePay.showPayButton).toBe(true);
    expect(applePay.isExpress).toBe(true);
    expect(applePay.isExpressPdp).toBe(true);
  });

  it('should format customer object correctly', async () => {
    applePay.customerData = {
      emailAddress: 'john@example.com',
      givenName: 'John',
      familyName: 'Doe',
      phoneNumber: '1234567890',
      addressLines: ['123 Main St', 'Apt 101'],
      locality: 'New York',
      countryCode: 'US',
      country: 'United States',
      administrativeArea: 'NY',
      postalCode: '10001',
    };
    applePay.billingData = {
      addressLines: ['123 Main St', 'Apt 101'],
      locality: 'New York',
      countryCode: 'US',
      country: 'United States',
      administrativeArea: 'NY',
      postalCode: '10001',
    };
    const customerObject = applePay.formatCustomerObject();
    expect(customerObject).toHaveProperty('addressBook');
    expect(customerObject).toHaveProperty('billingAddressDetails');
    expect(customerObject).toHaveProperty('customer');
    expect(customerObject).toHaveProperty('profile');
  });

  it('should handle authorized response correctly', async () => {
    const response = {
      fullResponse: {
        pspReference: '1234567890',
        resultCode: 'Authorised',
        paymentMethod: 'applepay',
        donationToken: 'token123',
        amount: { value: 100, currency: 'USD' },
      },
    };
    const resolve = jest.fn();
    applePay.handleAuthorised(response, resolve);
    expect(resolve).toHaveBeenCalledTimes(1);
    expect(resolve).toHaveBeenCalledWith({"newTotal": {"amount": "100", "label": "Test Merchant", "type": "final"}});
  });

  it('should handle error response correctly', async () => {
    const rejectApplePay = jest.fn();
    applePay.handleError(rejectApplePay);
    expect(rejectApplePay).toHaveBeenCalledTimes(1);
    expect(rejectApplePay).toHaveBeenCalledWith(applePay.APPLE_PAY_ERROR);
  });

  it('should handle Apple Pay response correctly', async () => {
    const response = {
      resultCode: 'Authorised',
    };
    const resolveApplePay = jest.fn();
    const rejectApplePay = jest.fn();
    applePay.handleApplePayResponse(response, resolveApplePay, rejectApplePay);
    expect(resolveApplePay).toHaveBeenCalledTimes(1);
    expect(rejectApplePay).not.toHaveBeenCalled();
  });

  it('should call payment from component correctly', async () => {
    const data = { paymentMethod: 'applepay' };
    const resolveApplePay = jest.fn();
    const rejectApplePay = jest.fn();
    $.ajax = jest.fn().mockReturnValue({
      resultCode: 'Authorised',
    });
    $.spinner = jest.fn().mockImplementation(() => ({
      start: jest.fn(),
      stop: jest.fn(),
    }));
    await applePay.callPaymentFromComponent(data, resolveApplePay, rejectApplePay);
    expect(resolveApplePay).toHaveBeenCalledTimes(1);
  });

  it('should select shipping method correctly', async () => {
    const shipmentUUID = '1234567890';
    const ID = 'shippingMethodID';
    $.ajax = jest.fn().mockReturnValueOnce({})
    await applePay.selectShippingMethod({ shipmentUUID, ID });
    expect($.ajax).toHaveBeenCalledTimes(1);
  });

  it('should get shipping method correctly', async () => {
    const shippingContact = {
      addressLines: ['123 Main St', 'Apt 101'],
      locality: 'New York',
      country: 'United States',
      countryCode: 'US',
      administrativeArea: 'NY',
      postalCode: '10001',
    };
    $.ajax.mockResolvedValueOnce({});
    await applePay.getShippingMethod(shippingContact);
    expect($.ajax).toHaveBeenCalledTimes(1);
  });

  it('should handle onAuthorized correctly', async () => {
    const authorizedEvent = {
      payment: {
        shippingContact: {
          addressLines: ['123 Main St', 'Apt 101'],
          locality: 'New York',
          country: 'United States',
          countryCode: 'US',
          administrativeArea: 'NY',
          postalCode: '10001',
        },
        billingContact: {
          addressLines: ['123 Main St', 'Apt 101'],
          locality: 'New York',
          country: 'United States',
          countryCode: 'US',
          administrativeArea: 'NY',
          postalCode: '10001',
        },
        token: {
          paymentData: 'token123',
        },
      },
    };
    const actions = { resolve: jest.fn(), reject: jest.fn() };
    $.ajax = jest.fn().mockReturnValue({
      resultCode: 'Authorised',
    });
    await applePay.onAuthorized({authorizedEvent}, actions);
    expect(actions.resolve).toHaveBeenCalledTimes(1);
  });

  it('should handle onShippingMethodSelected correctly', async () => {
    const event = {
      shippingMethod: {
        identifier: 'shippingMethodID',
      },
    };
    const resolve = jest.fn();
    const reject = jest.fn();
    $.ajax = jest.fn().mockResolvedValueOnce({ grandTotalAmount: { value: 100, currency: 'USD' } });
    $.ajax = jest.fn().mockResolvedValueOnce({ shippingMethods: [{ ID: 'shippingMethodID' }] });
    await applePay.onShippingMethodSelected(resolve, reject, event);
    expect($.ajax).toHaveBeenCalledTimes(2);
  });

  it('should handle onShippingContactSelected correctly', async () => {
    const event = {
      shippingContact: {
        locality: 'New York',
        country: 'United States',
        countryCode: 'US',
        administrativeArea: 'NY',
        postalCode: '10001',
      },
    };
    const resolve = jest.fn();
    const reject = jest.fn();
    $.ajax = jest.fn().mockReturnValue({ shippingMethods: [{ ID: 'shippingMethodID' }] });
    $.ajax = jest.fn().mockReturnValue({ grandTotalAmount: { value: 100, currency: 'USD' } });
    await applePay.onShippingContactSelected(resolve, reject, event);
    const selectShippingMethod = jest.fn();
    expect($.ajax).toHaveBeenCalledTimes(1);
  });

  it('should get component correctly', async () => {
    const initializeCheckout = jest.fn();
    initializeCheckout.mockResolvedValueOnce({});
    window.AdyenWeb.createComponent.mockReturnValueOnce({});

    await applePay.getComponent();
    expect(window.AdyenWeb.createComponent).toHaveBeenCalledTimes(1);
  });
});
