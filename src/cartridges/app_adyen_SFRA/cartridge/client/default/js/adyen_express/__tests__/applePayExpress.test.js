/**
 * @jest-environment jsdom
 */

const ApplePay = require('../paymentMethods/applepay/applepay');
const httpClient = require('../../../js/commons/httpClient');
const store = require('../../../../../../cartridge/store');
const helpers = require('../../../js/adyen_checkout/helpers');
const { APPLE_PAY } = require('../../../js/constants');
const { initializeCheckout } = require('../initializeCheckout');
const { createTemporaryBasket } = require('../../commons');

jest.mock('../../../js/commons/httpClient');
jest.mock('../../../../../../cartridge/store');
jest.mock('../../../js/adyen_checkout/helpers');
jest.mock('../initializeCheckout');
jest.mock('../../commons');

describe('ApplePay class', () => {
  let applePay;

  beforeEach(() => {
    jest.resetAllMocks();
    Object.defineProperty(global, 'window', {
      value: {
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

  it('should format address correctly', () => {
    const addressData = {
      addressLines: ['123 Main St', 'Apt 101'],
      locality: 'New York',
      countryCode: 'US',
      country: 'United States',
      administrativeArea: 'NY',
      postalCode: '10001',
      givenName: 'John',
      familyName: 'Doe',
    };
    const formattedAddress = applePay.formatAddress('customerData');
    expect(formattedAddress).toEqual({
      address1: addressData.addressLines[0],
      address2: addressData.addressLines[1],
      city: addressData.locality,
      countryCode: { displayValue: addressData.country, value: addressData.countryCode },
      firstName: addressData.givenName,
      lastName: addressData.familyName,
      postalCode: addressData.postalCode,
      stateCode: addressData.administrativeArea,
    });
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
    expect(resolve).toHaveBeenCalledWith(applePay.APPLE_PAY_SUCCESS);
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
    httpClient.mockResolvedValueOnce({});

    await applePay.callPaymentFromComponent(data, resolveApplePay, rejectApplePay);
    expect(httpClient).toHaveBeenCalledTimes(1);
    expect(resolveApplePay).toHaveBeenCalledTimes(1);
  });

  it('should select shipping method correctly', async () => {
    const shipmentUUID = '1234567890';
    const ID = 'shippingMethodID';
    httpClient.mockResolvedValueOnce({});

    await applePay.selectShippingMethod({ shipmentUUID, ID });
    expect(httpClient).toHaveBeenCalledTimes(1);
  });

  it('should get shipping method correctly', async () => {
    const shippingContact = {
      locality: 'New York',
      country: 'United States',
      countryCode: 'US',
      administrativeArea: 'NY',
      postalCode: '10001',
    };
    httpClient.mockResolvedValueOnce({});

    await applePay.getShippingMethod(shippingContact);
    expect(httpClient).toHaveBeenCalledTimes(1);
  });

  it('should handle onAuthorized correctly', async () => {
    const authorizedEvent = {
      payment: {
        shippingContact: {
          locality: 'New York',
          country: 'United States',
          countryCode: 'US',
          administrativeArea: 'NY',
          postalCode: '10001',
        },
        billingContact: {
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
    httpClient.mockResolvedValueOnce({});

    await applePay.onAuthorized(authorizedEvent, actions);
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
    httpClient.mockResolvedValueOnce({ shippingMethods: [{ ID: 'shippingMethodID' }] });
    httpClient.mockResolvedValueOnce({ grandTotalAmount: { value: 100, currency: 'USD' } });

    await applePay.onShippingMethodSelected(resolve, reject, event);
    expect(resolve).toHaveBeenCalledTimes(1);
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
    httpClient.mockResolvedValueOnce({
      shippingMethods: [{ ID: 'shippingMethodID', displayName: 'Test Method' }],
    });
    httpClient.mockResolvedValueOnce({ grandTotalAmount: { value: 100, currency: 'USD' } });

    await applePay.onShippingContactSelected(resolve, reject, event);
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it('should handle onClick correctly', async () => {
    const resolve = jest.fn();
    const reject = jest.fn();
    createTemporaryBasket.mockResolvedValueOnce({ temporaryBasketCreated: true, amount: { value: 100, currency: 'USD' } });

    await applePay.onClick(resolve, reject);
    expect(resolve).toHaveBeenCalledTimes(1);
  });

  it('should get component correctly', async () => {
    initializeCheckout.mockResolvedValueOnce({});
    window.AdyenWeb.createComponent.mockReturnValueOnce({});

    await applePay.getComponent();
    expect(initializeCheckout).toHaveBeenCalledTimes(1);
    expect(window.AdyenWeb.createComponent).toHaveBeenCalledTimes(1);
  });
});
