/**
 * @jest-environment jsdom
 */
const {
  formatCustomerObject,
  getShippingOptionsParameters,
  getTransactionInfo,
  onShippingAddressChange,
  onShippingOptionChange,
  getShippingMethods,
  selectShippingMethod,
  handleAuthorised,
  handleError,
  paymentFromComponent
} = require('../googlePayExpress');

jest.mock('../googlePayExpress.js', () => ({
  ...jest.requireActual('../googlePayExpress.js'),
  getShippingMethods: jest.fn(),
  selectShippingMethod: jest.fn(),
  getTransactionInfo: jest.fn(),
}));

describe('getTransactionInfo', () => {
  it('should correctly format transaction information', () => {
    const newCalculation = {
      locale: 'en-US',
      totals: {
        totalShippingCost: '$10.00',
        totalTax: '$5.00',
        subTotal: '$50.00',
      },
      grandTotalAmount: {
        value: '65.00',
        currency: 'USD',
      },
    };

    const expectedOutput = {
      countryCode: 'US',
      currencyCode: 'USD',
      totalPriceStatus: 'FINAL',
      totalPriceLabel: 'Total',
      totalPrice: '65.00',
    };

    const result = getTransactionInfo(newCalculation);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle missing or empty fields', () => {
    const newCalculation = {
      locale: 'fr-FR',
      totals: {
        totalShippingCost: '$0.00',
        totalTax: '$0.00',
        subTotal: '$0.00',
      },
      grandTotalAmount: {
        value: '0.00',
        currency: 'EUR',
      },
    };

    const expectedOutput = {
      countryCode: 'FR',
      currencyCode: 'EUR',
      totalPriceStatus: 'FINAL',
      totalPriceLabel: 'Total',
      totalPrice: '0.00',
    };

    const result = getTransactionInfo(newCalculation);
    expect(result).toEqual(expectedOutput);
  });
});

describe('formatCustomerObject', () => {
  it('should correctly format customer data', () => {
    const customerData = {
      shippingAddress: {
        name: 'John Doe',
        address1: '123 Main St',
        address2: 'Apt 4B',
        locality: 'New York',
        countryCode: 'USA',
        administrativeArea: 'NY',
        postalCode: '10001',
        phoneNumber: '123-456-7890',
      },
      paymentMethodData: {
        info: {
          billingAddress: {
            address1: '456 Elm St',
            address2: null,
            locality: 'Brooklyn',
            countryCode: 'USA',
            administrativeArea: 'NY',
            postalCode: '11201',
          },
        },
      },
      email: 'johndoe@example.com',
    };

    const expectedOutput = {
      addressBook: {
        addresses: {},
        preferredAddress: {
          address1: '123 Main St',
          address2: 'Apt 4B',
          city: 'New York',
          countryCode: {
            displayValue: 'USA',
            value: 'USA',
          },
          firstName: 'John',
          lastName: 'Doe',
          ID: 'johndoe@example.com',
          postalCode: '10001',
          stateCode: 'NY',
        },
      },
      billingAddressDetails: {
        address1: '456 Elm St',
        address2: null,
        city: 'Brooklyn',
        countryCode: {
          displayValue: 'USA',
          value: 'USA',
        },
        firstName: 'John',
        lastName: 'Doe',
        postalCode: '11201',
        stateCode: 'NY',
      },
      customer: {},
      profile: {
        firstName: 'John',
        lastName: 'Doe',
        email: 'johndoe@example.com',
        phone: '123-456-7890',
      },
    };

    const result = formatCustomerObject(customerData);
    expect(result).toEqual(expectedOutput);
  });

  it('should handle single-word names correctly', () => {
    const customerData = {
      shippingAddress: {
        name: 'Alice', // Single-word name
        address1: '789 Pine St',
        locality: 'Los Angeles',
        country: 'USA',
        administrativeArea: 'CA',
        postalCode: '90001',
        phoneNumber: null,
      },
      paymentMethodData: {
        info: {
          billingAddress: {
            address1: null,
            locality: null,
            country: null,
            administrativeArea: null,
            postalCode: null
          }
        }
      }
    }
  });
})

describe('getShippingOptionsParameters', () => {
  it('should return correct shipping options parameters', () => {
    const selectedShippingMethod = { ID: 'SM001' };
    const shippingMethodsData = {
      shippingMethods: [
        { ID: 'SM001', displayName: 'Standard Shipping', description: '3-5 business days' },
        { ID: 'SM002', displayName: 'Express Shipping', description: '1-2 business days' },
      ],
    };

    const result = getShippingOptionsParameters(selectedShippingMethod, shippingMethodsData);

    expect(result).toEqual({
      defaultSelectedOptionId: 'SM001',
      shippingOptions: [
        { label: 'Standard Shipping', description: '3-5 business days', id: 'SM001' },
        { label: 'Express Shipping', description: '1-2 business days', id: 'SM002' },
      ],
    });
  });

  it('should handle empty shipping methods', () => {
    const selectedShippingMethod = { ID: 'SM001' };
    const shippingMethodsData = { shippingMethods: [] };

    const result = getShippingOptionsParameters(selectedShippingMethod, shippingMethodsData);

    expect(result).toEqual({
      defaultSelectedOptionId: 'SM001',
      shippingOptions: [],
    });
  });

  it('should handle missing properties in shipping methods', () => {
    const selectedShippingMethod = { ID: 'SM001' };
    const shippingMethodsData = {
      shippingMethods: [
        { ID: 'SM001' },
        { displayName: 'Express Shipping' },
        { description: 'Next day delivery' },
      ],
    };

    const result = getShippingOptionsParameters(selectedShippingMethod, shippingMethodsData);

    expect(result).toEqual({
      defaultSelectedOptionId: 'SM001',
      shippingOptions: [
        { label: undefined, description: undefined, id: 'SM001' },
        { label: 'Express Shipping', description: undefined, id: undefined },
        { label: undefined, description: 'Next day delivery', id: undefined },
      ],
    });
  });
});

// describe('onShippingAddressChange', () => {
//   // Mock dependencies
//   const getShippingMethods = jest.fn();
//   const selectShippingMethod = jest.fn();
//   const getShippingOptionsParameters = jest.fn();
//   const getTransactionInfo = jest.fn();
//
//   beforeEach(() => {
//     // Reset mocks before each test
//     jest.clearAllMocks();
//   });
// 1
//   it('should return new shipping option parameters and transaction info when successful', async () => {
//     const shippingAddress = { address: '123 Test St' };
//     const shippingMethodsData = {
//       shippingMethods: [{ id: 'method1' }],
//     };
//     const newCalculation = { grandTotalAmount: 100 };
//     const expectedShippingOptionParameters = { param: 'value' };
//     const expectedTransactionInfo = { info: 'data' };
//
//     getShippingMethods.mockResolvedValue(shippingMethodsData);
//     selectShippingMethod.mockResolvedValue(newCalculation);
//     getShippingOptionsParameters.mockReturnValue(expectedShippingOptionParameters);
//     getTransactionInfo.mockReturnValue(expectedTransactionInfo);
//
//     const result = await onShippingAddressChange(shippingAddress);
//
//     expect(getShippingMethods).toHaveBeenCalledWith(shippingAddress);
//     expect(selectShippingMethod).toHaveBeenCalledWith(shippingMethodsData.shippingMethods[0]);
//     expect(getShippingOptionsParameters).toHaveBeenCalledWith(shippingMethodsData.shippingMethods[0], shippingMethodsData);
//     expect(getTransactionInfo).toHaveBeenCalledWith(newCalculation, shippingMethodsData);
//
//     expect(result).toEqual({
//       newShippingOptionParameters: expectedShippingOptionParameters,
//       newTransactionInfo: expectedTransactionInfo,
//     });
//   });
//
//   it('should return an error when no shipping methods are available', async () => {
//     const shippingAddress = { address: '123 Test St' };
//     const shippingMethodsData = { shippingMethods: [] };
//
//     getShippingMethods.mockResolvedValue(shippingMethodsData);
//
//     const result = await onShippingAddressChange(shippingAddress);
//
//     expect(getShippingMethods).toHaveBeenCalledWith(shippingAddress);
//     expect(selectShippingMethod).not.toHaveBeenCalled();
//     expect(getShippingOptionsParameters).not.toHaveBeenCalled();
//     expect(getTransactionInfo).not.toHaveBeenCalled();
//
//     expect(result).toEqual({
//       error: {
//         reason: 'SHIPPING_ADDRESS_UNSERVICEABLE',
//         message: 'Cannot ship to the selected address',
//         intent: 'SHIPPING_ADDRESS',
//       },
//     });
//   });
//
//   it('should return an error when selectShippingMethod does not return grandTotalAmount', async () => {
//     const shippingAddress = { address: '123 Test St' };
//     const shippingMethodsData = {
//       shippingMethods: [{ id: 'method1' }],
//     };
//     const newCalculation = { };
//
//     getShippingMethods.mockResolvedValue(shippingMethodsData);
//     selectShippingMethod.mockResolvedValue(newCalculation);
//
//     const result = await onShippingAddressChange(shippingAddress);
//
//     expect(getShippingMethods).toHaveBeenCalledWith(shippingAddress);
//     expect(selectShippingMethod).toHaveBeenCalledWith(shippingMethodsData.shippingMethods[0]);
//     expect(getShippingOptionsParameters).not.toHaveBeenCalled();
//     expect(getTransactionInfo).not.toHaveBeenCalled();
//
//     expect(result).toEqual({
//       error: {
//         reason: 'SHIPPING_ADDRESS_UNSERVICEABLE',
//         message: 'Cannot ship to the selected address',
//         intent: 'SHIPPING_ADDRESS',
//       },
//     });
//   });
// });

describe('getShippingMethods', () => {
  beforeEach(() => {
    global.$.ajax = jest.fn().mockImplementation(({ success }) => {
      success({ action : {}})
    });
    jest.clearAllMocks();
  });

  test('should make AJAX call with correct parameters when shipping address is provided', async () => {
    const mockResponse = { success: true };
    // $.ajax.mockResolvedValue(mockResponse);

    const shippingAddress = {
      locality: 'New York',
      country: 'United States',
      countryCode: 'US',
      administrativeArea: 'NY',
      postalCode: '10001'
    };

    const result = await getShippingMethods(shippingAddress);

    expect($.ajax).toHaveBeenCalledWith({
      type: 'POST',
      url: window.shippingMethodsUrl,
      data: {
        csrf_token: undefined,
        data: JSON.stringify({
          paymentMethodType: 'googlepay',
          isExpressPdp: true,
          address: {
            city: 'New York',
            country: 'United States',
            countryCode: 'US',
            stateCode: 'NY',
            postalCode: '10001'
          }
        })
      },
      success: expect.any(Function)
    });
  });

  test('should make AJAX call without address when shipping address is not provided', async () => {
    const mockResponse = { success: true };
    $.ajax.mockResolvedValue(mockResponse);

    const result = await getShippingMethods();

    expect($.ajax).toHaveBeenCalledWith({
      type: 'POST',
      url: window.shippingMethodsUrl,
      data: {
        csrf_token: undefined,
        data: JSON.stringify({
          paymentMethodType: 'googlepay',
          isExpressPdp: true
        })
      },
      success: expect.any(Function)
    });
  });

  test('should handle AJAX errors', async () => {
    const mockError = new Error('AJAX request failed');
    $.ajax.mockRejectedValue(mockError);

    await expect(getShippingMethods()).rejects.toThrow('AJAX request failed');
  });
});

describe('selectShippingMethod', () => {
  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  it('should make AJAX call with correct parameters', async () => {
    const mockResponse = { success: true };
    $.ajax.mockResolvedValue(mockResponse);

    const shipmentUUID = 'test-shipment-uuid';
    const ID = 'test-method-id';

    const result = await selectShippingMethod({ shipmentUUID, ID });

    expect($.ajax).toHaveBeenCalledWith({
      type: 'POST',
      url: window.selectShippingMethodUrl,
      data: {
        csrf_token: undefined,
        data: JSON.stringify({
          paymentMethodType: 'googlepay',
          shipmentUUID: 'test-shipment-uuid',
          methodID: 'test-method-id',
          isExpressPdp: true
        })
      },
      success: expect.any(Function)
    });

    expect(result).toEqual(mockResponse);
  });

  it('should handle AJAX errors', async () => {
    const mockError = new Error('AJAX request failed');
    $.ajax.mockRejectedValue(mockError);

    await expect(selectShippingMethod({ shipmentUUID: 'uuid', ID: 'id' }))
      .rejects.toThrow('AJAX request failed');
  });

  it('should handle missing parameters', async () => {
    await expect(selectShippingMethod({})).rejects.toThrow();
  });
});

describe('handleAuthorised', () => {
  // Mock DOM elements
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="result" />
      <form id="showConfirmationForm"></form>
    `;
  });

  it('handles response with full data', () => {
    const response = {
      fullResponse: {
        pspReference: 'PSP123',
        resultCode: 'SUCCESS',
        paymentMethod: 'CREDIT_CARD',
        donationToken: 'TOKEN123',
        amount: 100
      }
    };

    handleAuthorised(response);

    const resultInput = document.querySelector('#result');
    expect(resultInput.value).toBe(JSON.stringify({
      pspReference: 'PSP123',
      resultCode: 'SUCCESS',
      paymentMethod: 'CREDIT_CARD',
      donationToken: 'TOKEN123',
      amount: 100
    }));
  });

  it('handles response with payment method in additionalData', () => {
    const response = {
      fullResponse: {
        pspReference: 'PSP456',
        resultCode: 'SUCCESS',
        additionalData: {
          paymentMethod: 'PAYPAL'
        },
        donationToken: 'TOKEN456',
        amount: 200
      }
    };

    handleAuthorised(response);

    const resultInput = document.querySelector('#result');
    expect(resultInput.value).toBe(JSON.stringify({
      pspReference: 'PSP456',
      resultCode: 'SUCCESS',
      paymentMethod: 'PAYPAL',
      donationToken: 'TOKEN456',
      amount: 200
    }));
  });
});

describe('handleError', () => {
  // Mock DOM elements
  beforeEach(() => {
    document.body.innerHTML = `
      <input id="result" />
      <form id="showConfirmationForm"></form>
    `;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('updates #result with error information', () => {
    handleError();

    const resultInput = document.querySelector('#result');
    expect(resultInput.value).toBe(JSON.stringify({ error: true }));
  });

  it('submits #showConfirmationForm form', () => {
    const form = document.querySelector('#showConfirmationForm');
    form.submit = jest.fn(); // Mock the submit method

    handleError();

    expect(form.submit).toHaveBeenCalled();
  });

  it('handles missing #result element gracefully', () => {
    document.body.innerHTML = '<form id="showConfirmationForm"></form>'; // Remove #result

    handleError();

    // No errors should occur, and other functionality should still work
    const form = document.querySelector('#showConfirmationForm');
    form.submit = jest.fn();

    expect(form.submit).not.toThrow();
  });

  it('handles missing #showConfirmationForm element gracefully', () => {
    document.body.innerHTML = '<input id="result" />';

    handleError();

    const resultInput = document.querySelector('#result');
    expect(resultInput.value).toBe(JSON.stringify({ error: true }));
  });
});

describe('paymentFromComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });
  afterEach(() => {
    jest.resetModules();
  });
  it('starts spinner and makes ajax call with correct data', async () => {
    const start = jest.fn();
    global.$.spinner = jest.fn(() => {return {
      start: start
    }})
    global.$.ajax = jest.fn().mockImplementation(({ success }) => {
      success({ action : {}})
    });
    await paymentFromComponent({});
    expect(start).toHaveBeenCalledTimes(1);
  })
});

// describe('onShippingOptionChange', () => {
//   const {getShippingMethods, selectShippingMethod, getTransactionInfo} = require('../googlePayExpress');
//
//   beforeEach(() => {
//     jest.clearAllMocks(); // Clear mocks before each test
//   });
//
//   it('returns new transaction info when shipping method is valid', async () => {
//     const mockShippingAddress = {country: 'US', postalCode: '12345'};
//     const mockShippingOptionData = {id: 'method1'};
//     const mockShippingMethodsData = {
//       shippingMethods: [{ID: 'method1', name: 'Standard Shipping'}],
//     };
//     const mockCalculation = {grandTotalAmount: 100};
//     const mockTransactionInfo = {totalPrice: '100.00', currencyCode: 'USD'};
//
//     // Mock the dependent functions
//     getShippingMethods.mockResolvedValue(mockShippingMethodsData);
//     selectShippingMethod.mockResolvedValue(mockCalculation);
//     getTransactionInfo.mockReturnValue(mockTransactionInfo);
//
//     const result = await onShippingOptionChange(
//       mockShippingAddress,
//       mockShippingOptionData,
//     );
//
//     expect(getShippingMethods).toHaveBeenCalledWith(mockShippingAddress);
//     expect(selectShippingMethod).toHaveBeenCalledWith(
//       mockShippingMethodsData.shippingMethods[0],
//     );
//     expect(getTransactionInfo).toHaveBeenCalledWith(
//       mockCalculation,
//       mockShippingMethodsData,
//     );
//     expect(result).toEqual({newTransactionInfo: mockTransactionInfo});
//   });
//
//   // it('returns error when no matching shipping method is found', async () => {
//   //   const mockShippingAddress = {country: 'US', postalCode: '12345'};
//   //   const mockShippingOptionData = {id: 'invalid-method'};
//   //   const mockShippingMethodsData = {
//   //     shippingMethods: [{ID: 'method1', name: 'Standard Shipping'}],
//   //   };
//   //
//   //   // Mock the dependent functions
//   //   getShippingMethods.mockResolvedValue(mockShippingMethodsData);
//   //
//   //   const result = await onShippingOptionChange(
//   //     mockShippingAddress,
//   //     mockShippingOptionData,
//   //   );
//   //
//   //   expect(getShippingMethods).toHaveBeenCalledWith(mockShippingAddress);
//   //   expect(result).toEqual({
//   //     error: {
//   //       reason: 'SHIPPING_ADDRESS_UNSERVICEABLE',
//   //       message: 'Cannot ship to the selected address',
//   //       intent: 'SHIPPING_OPTION',
//   //     },
//   //   });
//   // });
// });