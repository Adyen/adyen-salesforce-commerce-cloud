/**
 * @jest-environment jsdom
 */
const applePayExpressModule = require('../applePayExpress');
const {
  createApplePayButton,
  initializeCheckout,
  onAuthorized,
  onShippingMethodSelected,
  onShippingContactSelected,
  handleAuthorised,
  handleError
} = require("../applePayExpress");

const APPLE_PAY = 'applepay';
const mockCreate = jest.fn();

let getPaymentMethods = applePayExpressModule.getPaymentMethods;
let formatCustomerObject = applePayExpressModule.formatCustomerObject;
let callPaymentFromComponent = applePayExpressModule.callPaymentFromComponent;
let selectShippingMethod = applePayExpressModule.selectShippingMethod;
let getShippingMethod = applePayExpressModule.getShippingMethod;
let spy;

global.checkout = { create: mockCreate };
global.fetch = jest.fn();

jest.mock('../applePayExpress', () => ({
  handleAuthorised: jest.fn(),
  handleError: jest.fn(),
  getPaymentMethods: jest.fn(),
  formatCustomerObject: jest.fn(),
  selectShippingMethod: jest.fn()
}));

beforeAll(() => {
  spy = jest.spyOn(document, 'querySelector');
});

describe('formatCustomerObject', () => {
  it('should correctly format customer and billing data', () => {
    const customerData = {
      addressLines: ['123 Main St', 'Apt 4B'],
      locality: 'Springfield',
      country: 'United States',
      countryCode: 'US',
      givenName: 'John',
      familyName: 'Doe',
      emailAddress: 'john.doe@example.com',
      postalCode: '12345',
      administrativeArea: 'IL',
      phoneNumber: '555-555-5555',
    };

    const billingData = {
      addressLines: ['456 Oak St'],
      locality: 'Shelbyville',
      country: 'United States',
      countryCode: 'US',
      givenName: 'John',
      familyName: 'Doe',
      postalCode: '67890',
      administrativeArea: 'IN',
    };

    const expectedOutput = {
      addressBook: {
        addresses: {},
        preferredAddress: {
          address1: '123 Main St',
          address2: 'Apt 4B',
          city: 'Springfield',
          countryCode: {
            displayValue: 'United States',
            value: 'US',
          },
          firstName: 'John',
          lastName: 'Doe',
          ID: 'john.doe@example.com',
          postalCode: '12345',
          stateCode: 'IL',
        },
      },
      billingAddressDetails: {
        address1: '456 Oak St',
        address2: null,
        city: 'Shelbyville',
        countryCode: {
          displayValue: 'United States',
          value: 'US',
        },
        firstName: 'John',
        lastName: 'Doe',
        postalCode: '67890',
        stateCode: 'IN',
      },
      customer: {},
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '555-555-5555',
      },
    };

    const result = formatCustomerObject(customerData, billingData);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle missing address lines in billing data', () => {
    const customerData = {
      addressLines: ['123 Main St', 'Apt 4B'],
      locality: 'Springfield',
      country: 'United States',
      countryCode: 'US',
      givenName: 'Jane',
      familyName: 'Doe',
      emailAddress: 'jane.doe@example.com',
      postalCode: '12345',
      administrativeArea: 'IL',
      phoneNumber: '555-123-4567',
    };

    const billingData = {
      addressLines: ['789 Elm St'],
      locality: 'Capital City',
      country: 'United States',
      countryCode: 'US',
      givenName: 'Jane',
      familyName: 'Doe',
      postalCode: '98765',
      administrativeArea: 'CA',
    };

    const expectedOutput = {
      addressBook: {
        addresses: {},
        preferredAddress: {
          address1: '123 Main St',
          address2: 'Apt 4B',
          city: 'Springfield',
          countryCode: {
            displayValue: 'United States',
            value: 'US',
          },
          firstName: 'Jane',
          lastName: 'Doe',
          ID: 'jane.doe@example.com',
          postalCode: '12345',
          stateCode: 'IL',
        },
      },
      billingAddressDetails: {
        address1: '789 Elm St',
        address2: null,
        city: 'Capital City',
        countryCode: {
          displayValue: 'United States',
          value: 'US',
        },
        firstName: 'Jane',
        lastName: 'Doe',
        postalCode: '98765',
        stateCode: 'CA',
      },
      customer: {},
      profile: {
        firstName: 'Jane',
        lastName: 'Doe',
        email: 'jane.doe@example.com',
        phone: '555-123-4567',
      },
    };

    const result = formatCustomerObject(customerData, billingData);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle customer data with a single address line', () => {
    const customerData = {
      addressLines: ['123 Main St'],
      locality: 'Springfield',
      country: 'United States',
      countryCode: 'US',
      givenName: 'Alice',
      familyName: 'Johnson',
      emailAddress: 'alice.johnson@example.com',
      postalCode: '54321',
      administrativeArea: 'TX',
      phoneNumber: '555-678-9101',
    };

    const billingData = {
      addressLines: ['987 Maple St'],
      locality: 'Metropolis',
      country: 'United States',
      countryCode: 'US',
      givenName: 'Alice',
      familyName: 'Johnson',
      postalCode: '76543',
      administrativeArea: 'FL',
    };

    const expectedOutput = {
      addressBook: {
        addresses: {},
        preferredAddress: {
          address1: '123 Main St',
          address2: null,
          city: 'Springfield',
          countryCode: {
            displayValue: 'United States',
            value: 'US',
          },
          firstName: 'Alice',
          lastName: 'Johnson',
          ID: 'alice.johnson@example.com',
          postalCode: '54321',
          stateCode: 'TX',
        },
      },
      billingAddressDetails: {
        address1: '987 Maple St',
        address2: null,
        city: 'Metropolis',
        countryCode: {
          displayValue: 'United States',
          value: 'US',
        },
        firstName: 'Alice',
        lastName: 'Johnson',
        postalCode: '76543',
        stateCode: 'FL',
      },
      customer: {},
      profile: {
        firstName: 'Alice',
        lastName: 'Johnson',
        email: 'alice.johnson@example.com',
        phone: '555-678-9101',
      },
    };

    const result = formatCustomerObject(customerData, billingData);
    expect(result).toEqual(expectedOutput);
  });
});

describe('handleAuthorised', () => {
  let mockResolveApplePay;
  let mockQuerySelector;
  let mockResultInput;
  let mockFormSubmit;

  beforeEach(() => {
    mockResolveApplePay = jest.fn();
    mockResultInput = {
      value: '',
    };
    mockFormSubmit = jest.fn();
    mockQuerySelector = jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector === '#result') {
        return mockResultInput;
      }
      if (selector === '#showConfirmationForm') {
        return {
          submit: mockFormSubmit,
        };
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle authorized response and update the result input field', () => {
    const response = {
      fullResponse: {
        pspReference: 'ABC123',
        resultCode: 'Authorised',
        paymentMethod: 'applepay',
        donationToken: 'DONATION123',
        amount: {
          value: 1000,
          currency: 'USD',
        },
      },
    };

    handleAuthorised(response, mockResolveApplePay);
    expect(mockResolveApplePay).toHaveBeenCalled();
    expect(mockResultInput.value).toBe(
      JSON.stringify({
        pspReference: 'ABC123',
        resultCode: 'Authorised',
        paymentMethod: 'applepay',
        donationToken: 'DONATION123',
        amount: {
          value: 1000,
          currency: 'USD',
        },
      })
    );
    expect(mockFormSubmit).toHaveBeenCalled();
  });

  it('should handle case where paymentMethod is missing but available in additionalData', () => {
    const response = {
      fullResponse: {
        pspReference: 'XYZ789',
        resultCode: 'Authorised',
        additionalData: {
          paymentMethod: 'creditcard',
        },
        donationToken: 'DONATION456',
        amount: {
          value: 500,
          currency: 'EUR',
        },
      },
    };

    handleAuthorised(response, mockResolveApplePay);
    expect(mockResolveApplePay).toHaveBeenCalled();
    expect(mockResultInput.value).toBe(
      JSON.stringify({
        pspReference: 'XYZ789',
        resultCode: 'Authorised',
        paymentMethod: 'creditcard',
        donationToken: 'DONATION456',
        amount: {
          value: 500,
          currency: 'EUR',
        },
      })
    );
    expect(mockFormSubmit).toHaveBeenCalled();
  });

  it('should handle case where some optional fields are missing', () => {
    const response = {
      fullResponse: {
        pspReference: 'LMN456',
        resultCode: 'Authorised',
        amount: {
          value: 750,
          currency: 'GBP',
        },
      },
    };
    handleAuthorised(response, mockResolveApplePay);
    expect(mockResolveApplePay).toHaveBeenCalled();
    expect(mockResultInput.value).toBe(
      JSON.stringify({
        pspReference: 'LMN456',
        resultCode: 'Authorised',
        paymentMethod: undefined,
        donationToken: undefined,
        amount: {
          value: 750,
          currency: 'GBP',
        },
      })
    );
    expect(mockFormSubmit).toHaveBeenCalled();
  });
});

describe('handleError', () => {
  let mockRejectApplePay;
  let mockQuerySelector;
  let mockResultInput;
  let mockFormSubmit;

  beforeEach(() => {
    mockRejectApplePay = jest.fn();
    mockResultInput = {
      value: '',
    };
    mockFormSubmit = jest.fn();
    mockQuerySelector = jest.spyOn(document, 'querySelector').mockImplementation((selector) => {
      if (selector === '#result') {
        return mockResultInput;
      }
      if (selector === '#showConfirmationForm') {
        return {
          submit: mockFormSubmit,
        };
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should handle the error correctly and update the result input field', () => {
    handleError(mockRejectApplePay);
    expect(mockRejectApplePay).toHaveBeenCalled();
    expect(mockResultInput.value).toBe(
      JSON.stringify({
        error: true,
      })
    );
    expect(mockFormSubmit).toHaveBeenCalled();
  });
});

describe('callPaymentFromComponent', () => {
  const mockResolveApplePay = jest.fn();
  const mockRejectApplePay = jest.fn();
  const mockData = { some: 'data' };
  let mockElementDiv;
  let mockElementForm

  beforeEach(() => {
    jest.clearAllMocks();
    window.paymentFromComponentURL = '/test-url';
    window.showConfirmationAction = '/confirmation-action';
    mockElementForm = document.createElement('form');
    mockElementForm.setAttribute("id", "showConfirmationForm");
    mockElementDiv = document.createElement('div');
    mockElementDiv.setAttribute("id", "additionalDetailsHidden");
    spy.mockReturnValue(mockElementForm);
    spy.mockReturnValue(mockElementDiv);
  });

  it('should call rejectApplePay on ajax fail', async () => {
    global.$.ajax = jest.fn().mockImplementation(({ success }) => ({
      fail: (callback) => {
        callback();
      },
    }));
    await callPaymentFromComponent(mockData, mockResolveApplePay, mockRejectApplePay);
    expect(mockRejectApplePay).toHaveBeenCalled();
  });
});

describe('getShippingMethod', () => {
  const mockBasketId = 'test-basket-id';
  const mockResponse = { status: 200, json: jest.fn().mockResolvedValue({}) };

  beforeEach(() => {
    jest.clearAllMocks();
    window.shippingMethodsUrl = '/test-shipping-methods-url';
  });

  it('should handle fetch rejection', async () => {
    fetch.mockRejectedValue(new Error('Fetch failed'));
    try {
      await getShippingMethod(null);
    } catch (error) {
      expect(error.message).toBe('Fetch failed');
    }
  });
});

describe('initializeCheckout', () => {
  let mockPaymentMethodsResponse;
  let AdyenCheckout;

  beforeEach(() => {
    jest.clearAllMocks();
    window.environment = 'test-env';
    window.clientKey = 'test-client-key';
    window.locale = 'en-US';
    mockPaymentMethodsResponse = {
      json: jest.fn().mockResolvedValue({
        applicationInfo: {
          some: 'info',
        },
      }),
    };
    global.fetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: jest.fn().mockResolvedValue({
        applicationInfo: {
          some: 'info',
        },
      }),
    })
    getPaymentMethods = jest.fn().mockImplementation({
      json: jest.fn().mockResolvedValue({
        applicationInfo: {
          some: 'info',
        },
      }),
    })
    AdyenCheckout = jest.fn().mockResolvedValueOnce({})
  });

  it('should handle errors when getPaymentMethods fails', async () => {
    try {
      await initializeCheckout();
    } catch (error) {
      expect(error.message).toBe('Fetch failed');
    }
  });
});

describe('createApplePayButton', () => {
  const applePayButtonConfig = { configKey: 'configValue' };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should call checkout.create with APPLE_PAY and applePayButtonConfig', async () => {
    const mockButtonInstance = {
      mount: {}
    }
    mockCreate.mockImplementationOnce(() => (mockButtonInstance));
    const result = await createApplePayButton(applePayButtonConfig);
    expect(result).toMatchObject(mockButtonInstance);
  });

  it('should handle errors thrown by checkout.create', async () => {
    const mockError = new Error('Failed to create Apple Pay button');
    mockCreate.mockRejectedValue(mockError);
    try {
      await createApplePayButton(applePayButtonConfig);
    } catch (error) {
      expect(error).toBe(mockError);
    }
  });
});

describe('onAuthorized function', () => {
  let resolve;
  let reject;
  let event;
  let amountValue;
  let merchantName;
  let temporaryBasketId;

  beforeEach(() => {
    resolve = jest.fn();
    reject = jest.fn();
    amountValue = 100;
    merchantName = 'Test Merchant';
    temporaryBasketId = 'mocked-basket-id';
    window.digitsNumber = '2';
    event = {
      payment: {
        shippingContact: { mock: 'shipping' },
        billingContact: { mock: 'billing' },
        token: {
          paymentData: 'mocked-payment-token',
        },
      },
    };
  });

  it('should resolve with the correct final price update', async () => {
    formatCustomerObject = jest.fn().mockImplementation(() => {
      return {}
    })
    callPaymentFromComponent = jest.fn().mockImplementation((data, resolveApplePay) => {
      resolveApplePay();
    });

    await onAuthorized(resolve, reject, event, amountValue, merchantName);

    setTimeout(() => {
      expect(formatCustomerObject).toHaveBeenCalled();

      expect(callPaymentFromComponent).toHaveBeenCalledWith(
        {
          paymentMethod: {
            type: 'APPLE_PAY',
            applePayToken: event.payment.token.paymentData,
          },
          paymentType: 'express',
          customer: { mock: 'formattedCustomer' },
          basketId: 'mocked-basket-id',
        },
        expect.any(Function),
        reject
      );

      expect(resolve).toHaveBeenCalledWith({
        newTotal: {
          type: 'final',
          label: merchantName,
          amount: '10000'
        },
      });
    })
  });

  it('should reject if an error occurs', async () => {
    const error = new Error('mock error');

    callPaymentFromComponent.mockImplementation(() => {
      throw error;
    });

    await onAuthorized(resolve, reject, event, amountValue, merchantName);

    setTimeout(() => {
      expect(reject).toHaveBeenCalledWith(error);
    })
  });

  it('should correctly calculate the amount with a different digitsNumber', async () => {
    window.digitsNumber = '3';

    callPaymentFromComponent.mockImplementation((data, resolveApplePay) => {
      resolveApplePay();
    });

    await onAuthorized(resolve, reject, event, amountValue, merchantName);

    setTimeout(() => {
      expect(resolve).toHaveBeenCalledWith({
        newTotal: {
          type: 'final',
          label: merchantName,
          amount: '100000',
        },
      });
    })
  });
});

describe('onShippingMethodSelected function', () => {
  let resolve;
  let reject;
  let event;
  let applePayButtonConfig;
  let merchantName;
  let temporaryBasketId;
  let shippingMethodsData;

  beforeEach(() => {
    resolve = jest.fn();
    reject = jest.fn();

    applePayButtonConfig = {
      amount: {},
    };

    merchantName = 'Test Merchant';
    temporaryBasketId = 'mocked-basket-id';

    shippingMethodsData = {
      shippingMethods: [
        { ID: 'shipping-method-1', label: 'Standard Shipping' },
        { ID: 'shipping-method-2', label: 'Express Shipping' },
      ],
    };

    event = {
      shippingMethod: {
        identifier: 'shipping-method-1',
      },
    };

    jest.clearAllMocks();
  });

  it('should resolve with the correct applePayShippingMethodUpdate when shipping method is selected successfully', async () => {
    const mockCalculationResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        grandTotalAmount: {
          value: '150.00',
          currency: 'USD',
        },
      }),
    };
    selectShippingMethod = jest.fn().mockImplementation((data, resolveApplePay) => {
      return mockCalculationResponse
    });
    await onShippingMethodSelected(resolve, reject, event, applePayButtonConfig, merchantName, shippingMethodsData.shippingMethods);

    const matchingShippingMethod = { ID: 'shipping-method-1', label: 'Standard Shipping', shipmentUUID: '1234' }

    setTimeout(() => {
      expect(selectShippingMethod).toHaveBeenCalledWith(matchingShippingMethod, temporaryBasketId);
      expect(applePayButtonConfig.amount).toEqual({
        value: '150.00',
        currency: 'USD',
      });
      expect(resolve).toHaveBeenCalledWith({
        newTotal: {
          type: 'final',
          label: merchantName,
          amount: '150.00',
        },
      });
      expect(reject).not.toHaveBeenCalled();
    })
  });

  it('should reject if selectShippingMethod returns an error', async () => {
    const mockCalculationResponse = {
      ok: false,
    };
    selectShippingMethod.mockResolvedValue(mockCalculationResponse);

    await onShippingMethodSelected(resolve, reject, event, applePayButtonConfig, merchantName, shippingMethodsData.shippingMethods);

    const matchingShippingMethod = shippingMethodsData.shippingMethods[0];

    setTimeout(() => {
      expect(selectShippingMethod).toHaveBeenCalledWith(matchingShippingMethod, temporaryBasketId);
      expect(reject).toHaveBeenCalled();
      expect(resolve).not.toHaveBeenCalled();
    })
  });
});

describe('Test shipping method selection and calculation flow', () => {
  let resolve;
  let reject;
  let event;
  let temporaryBasketId;
  let merchantName;
  let shippingMethodsData;

  beforeEach(() => {
    resolve = jest.fn();
    reject = jest.fn();

    temporaryBasketId = 'mocked-basket-id';
    merchantName = 'Test Merchant';

    event = {
      shippingContact: { address: 'mocked-address' },
      shippingMethod: {
        identifier: 'shipping-method-1',
      },
    };
    shippingMethodsData = {
      shippingMethods: [
        { ID: 'shipping-method-1', label: 'Standard Shipping' },
        { ID: 'shipping-method-2', label: 'Express Shipping' },
      ],
    }
    jest.clearAllMocks();
  });

  it('should resolve with the correct applePayShippingContactUpdate when shipping method selection and calculation succeeds', async () => {
    const mockShippingMethodsResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        shippingMethods: [
          {
            ID: 'shipping-method-1',
            displayName: 'Standard Shipping',
            description: 'Arrives in 5-7 days',
            shippingCost: { value: '5.00' },
          },
        ],
      }),
    };

    getShippingMethod = jest.fn().mockImplementation((data, resolveApplePay) => {
      return mockShippingMethodsResponse
    });

    const mockCalculationResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        grandTotalAmount: {
          value: '105.00',
        },
      }),
    };

    selectShippingMethod.mockResolvedValue(mockCalculationResponse);

    await onShippingMethodSelected(resolve, reject, event, { amount: {} }, merchantName, shippingMethodsData.shippingMethods);

    setTimeout(() => {
      expect(getShippingMethod).toHaveBeenCalledWith(event.shippingContact, temporaryBasketId);
      expect(selectShippingMethod).toHaveBeenCalledWith(
        {
          ID: 'shipping-method-1',
          displayName: 'Standard Shipping',
          description: 'Arrives in 5-7 days',
          shippingCost: { value: '5.00' },
        },
        temporaryBasketId
      );
      expect(resolve).toHaveBeenCalledWith({
        newShippingMethods: [
          {
            label: 'Standard Shipping',
            detail: 'Arrives in 5-7 days',
            identifier: 'shipping-method-1',
            amount: '5.00',
          },
        ],
        newTotal: {
          type: 'final',
          label: merchantName,
          amount: '105.00',
        },
      });
      expect(reject).not.toHaveBeenCalled();
    })
  });

  it('should reject when getShippingMethod fails', async () => {
    const mockShippingMethodsResponse = {
      ok: false,
    };

    getShippingMethod = jest.fn().mockImplementation((data, resolveApplePay) => {
      return mockShippingMethodsResponse
    });

    await onShippingMethodSelected(resolve, reject, event, { amount: {} }, merchantName, shippingMethodsData.shippingMethods);

    setTimeout(() => {
      expect(getShippingMethod).toHaveBeenCalledWith(event.shippingContact, temporaryBasketId);
      expect(reject).toHaveBeenCalled();
      expect(resolve).not.toHaveBeenCalled();
    })
  });

  it('should reject when there are no shipping methods available', async () => {
    const mockShippingMethodsResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        shippingMethods: [],
      }),
    };

    getShippingMethod = jest.fn().mockImplementation((data, resolveApplePay) => {
      return mockShippingMethodsResponse
    });

    await onShippingMethodSelected(resolve, reject, event, { amount: {} }, merchantName, shippingMethodsData.shippingMethods);

    expect(reject).toHaveBeenCalled();
    expect(resolve).not.toHaveBeenCalled();
  });

  it('should reject when selectShippingMethod fails', async () => {
    const mockShippingMethodsResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        shippingMethods: [
          {
            ID: 'shipping-method-1',
            displayName: 'Standard Shipping',
            description: 'Arrives in 5-7 days',
            shippingCost: { value: '5.00' },
          },
        ],
      }),
    };

    getShippingMethod = jest.fn().mockImplementation((data, resolveApplePay) => {
      return mockShippingMethodsResponse
    });

    const mockCalculationResponse = {
      ok: false,
    };

    selectShippingMethod.mockResolvedValue(mockCalculationResponse);

    await onShippingMethodSelected(resolve, reject, event, { amount: {} }, merchantName, shippingMethodsData.shippingMethods);

    expect(reject).toHaveBeenCalled();
    expect(resolve).not.toHaveBeenCalled();
  });
});


describe('onShippingContactSelected', () => {
  let resolve;
  let reject;
  let event;
  let merchantName;
  let temporaryBasketId;

  beforeEach(() => {
    resolve = jest.fn();
    reject = jest.fn();

    event = {
      shippingContact: { address: '123 Test Street' },
    };

    merchantName = 'Test Merchant';
    temporaryBasketId = 'mock-basket-id';

    jest.clearAllMocks();
  });

  it('should resolve with the correct applePayShippingContactUpdate when all operations succeed', async () => {
    const mockShippingMethodsResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        shippingMethods: [
          {
            ID: 'shipping-method-1',
            displayName: 'Standard Shipping',
            description: 'Arrives in 3-5 days',
            shippingCost: { value: '5.00' },
          },
        ],
      }),
    };
    getShippingMethod = jest.fn().mockImplementation((data, resolveApplePay) => {
      return mockShippingMethodsResponse
    });

    const mockCalculationResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        grandTotalAmount: { value: '105.00' },
      }),
    };
    selectShippingMethod.mockResolvedValue(mockCalculationResponse);

    await onShippingContactSelected(resolve, reject, event, merchantName);

    setTimeout(() => {
      expect(getShippingMethod).toHaveBeenCalledWith(event.shippingContact, temporaryBasketId);
      expect(selectShippingMethod).toHaveBeenCalledWith(
        {
          ID: 'shipping-method-1',
          displayName: 'Standard Shipping',
          description: 'Arrives in 3-5 days',
          shippingCost: { value: '5.00' },
        },
        temporaryBasketId
      );

      expect(resolve).toHaveBeenCalledWith({
        newShippingMethods: [
          {
            label: 'Standard Shipping',
            detail: 'Arrives in 3-5 days',
            identifier: 'shipping-method-1',
            amount: '5.00',
          },
        ],
        newTotal: {
          type: 'final',
          label: merchantName,
          amount: '105.00',
        },
      });

      expect(reject).not.toHaveBeenCalled();
    })
  });

  it('should reject when getShippingMethod fails', async () => {
    const mockShippingMethodsResponse = { ok: false };
    getShippingMethod.mockResolvedValue(mockShippingMethodsResponse);

    await onShippingContactSelected(resolve, reject, event, merchantName);

    setTimeout(() => {
      expect(getShippingMethod).toHaveBeenCalledWith(event.shippingContact, temporaryBasketId);
      expect(reject).toHaveBeenCalled();
      expect(resolve).not.toHaveBeenCalled();
    })
  });

  it('should reject when no shipping methods are available', async () => {
    const mockShippingMethodsResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        shippingMethods: [],
      }),
    };
    getShippingMethod.mockResolvedValue(mockShippingMethodsResponse);

    await onShippingContactSelected(resolve, reject, event, merchantName);

    setTimeout(() => {
      expect(reject).toHaveBeenCalled();
      expect(resolve).not.toHaveBeenCalled();
    })
  });

  it('should reject when selectShippingMethod fails', async () => {
    const mockShippingMethodsResponse = {
      ok: true,
      json: jest.fn().mockResolvedValue({
        shippingMethods: [
          {
            ID: 'shipping-method-1',
            displayName: 'Standard Shipping',
            description: 'Arrives in 3-5 days',
            shippingCost: { value: '5.00' },
          },
        ],
      }),
    };
    getShippingMethod.mockResolvedValue(mockShippingMethodsResponse);

    const mockCalculationResponse = { ok: false };
    selectShippingMethod.mockResolvedValue(mockCalculationResponse);

    await onShippingContactSelected(resolve, reject, event, merchantName);

    setTimeout(() => {
      expect(selectShippingMethod).toHaveBeenCalledWith(
        {
          ID: 'shipping-method-1',
          displayName: 'Standard Shipping',
          description: 'Arrives in 3-5 days',
          shippingCost: { value: '5.00' },
        },
        temporaryBasketId
      );
      expect(reject).toHaveBeenCalled();
      expect(resolve).not.toHaveBeenCalled();
    })
  });
});
