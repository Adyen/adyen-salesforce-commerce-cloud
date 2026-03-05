jest.mock('*/cartridge/adyen/utils/lineItemHelper', () => ({
  getDescription: jest.fn((lineItem) => lineItem.productName),
  getId: jest.fn((lineItem) => lineItem.productID),
  getQuantity: jest.fn((lineItem) => lineItem.quantityValue),
  getItemAmount: jest.fn((lineItem) => ({
    value: lineItem.adjustedNetPrice,
    divide: jest.fn((qty) => ({
      value: { toFixed: () => String(lineItem.adjustedNetPrice / qty) },
    })),
  })),
  getVatAmount: jest.fn((lineItem) => ({
    value: lineItem.getAdjustedTax,
    divide: jest.fn((qty) => ({
      value: { toFixed: () => String(lineItem.getAdjustedTax / qty) },
    })),
  })),
  isProductLineItem: jest.fn(() => false),
}));

const { getLineItems } = require('*/cartridge/adyen/scripts/payments/adyenLevelTwoThreeData');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');

describe('getLineItems (Enhanced Scheme Data)', () => {
  const mockLineItem = {
    productName: 'Super Widget',
    productID: 'SW1234567890X',
    quantityValue: 2,
    adjustedNetPrice: 100,
	getAdjustedTax: 20,
  };

  const createMockOrderOrBasket = (customerData = {}) => ({
    getProductLineItems: () => ({
      toArray: () => [mockLineItem],
    }),
    getShipments: () => ({
      toArray: () => [],
    }),
    getCustomer: () => ({
      registered: customerData.registered || false,
      getID: () => customerData.customerId || 'anon-id',
      getProfile: () =>
        customerData.registered
          ? { getCustomerNo: () => customerData.customerNo || 'cust123' }
          : null,
    }),
    getCustomerNo: () => customerData.customerNo || null,
  });

  it('should return enhanced line item fields with tax, description, and commodity code', () => {
    const result = getLineItems({
      Order: createMockOrderOrBasket({ registered: true, customerNo: 'cust-9999' }),
    });

    expect(result).toEqual({
      'enhancedSchemeData.totalTaxAmount': 10, 
      'enhancedSchemeData.customerReference': 'cust-9999',
      'enhancedSchemeData.itemDetailLine1.unitPrice': '50', 
      'enhancedSchemeData.itemDetailLine1.totalAmount': 100, 
      'enhancedSchemeData.itemDetailLine1.quantity': 2,
      'enhancedSchemeData.itemDetailLine1.unitOfMeasure': 'EAC',
      'enhancedSchemeData.itemDetailLine1.commodityCode': 'mocked_comodity_code',
      'enhancedSchemeData.itemDetailLine1.description': 'Super Widget',
      'enhancedSchemeData.itemDetailLine1.productCode': 'SW1234567890',
    });
  });

  it('should truncate customerReference to 25 characters', () => {
    const longCustomerNo = 'very-long-customer-number-1234567890';
    const result = getLineItems({
      Order: createMockOrderOrBasket({ registered: true, customerNo: longCustomerNo }),
    });

    expect(result['enhancedSchemeData.customerReference'].length).toBeLessThanOrEqual(25);
  });

  it('should return null when no Order or Basket is passed', () => {
    expect(getLineItems({})).toBeNull();
  });

  it('should fallback to getCustomer().getID() if no profile or customerNo', () => {
    const result = getLineItems({
      Basket: createMockOrderOrBasket({ customerId: 'anon-user' }),
    });

    expect(result['enhancedSchemeData.customerReference']).toBe('anon-user');
  });

  it('should use default "no-unique-ref" if no customer ID or profile available', () => {
    const result = getLineItems({
      Order: {
        getProductLineItems: () => ({
          toArray: () => [mockLineItem],
        }),
        getShipments: () => ({
          toArray: () => [],
        }),
        getCustomer: () => ({
          getID: () => null
        }),
        getCustomerNo: () => null,
      },
    });

    expect(result['enhancedSchemeData.customerReference']).toBe('no-unique-ref');
  });

  it('should include discount amount when product has basePrice > adjustedPrice', () => {
    const lineItemHelper = require('*/cartridge/adyen/utils/lineItemHelper');
    lineItemHelper.isProductLineItem.mockReturnValueOnce(true);

    AdyenHelper.getCurrencyValueForApi = jest.fn(() => ({
      divide: jest.fn(() => ({
        value: { toFixed: () => '10' },
      })),
    }));

    const discountedLineItem = {
      ...mockLineItem,
      basePrice: {
        value: 120,
        subtract: jest.fn((adjustedPrice) => ({
          value: 20,
        })),
      },
      adjustedPrice: {
        value: 100,
      },
    };

    const result = getLineItems({
      Order: {
        getProductLineItems: () => ({
          toArray: () => [discountedLineItem],
        }),
        getShipments: () => ({
          toArray: () => [],
        }),
        getCustomer: () => ({
          registered: true,
          getID: () => 'cust-id',
          getProfile: () => ({ getCustomerNo: () => 'cust-123' }),
        }),
        getCustomerNo: () => 'cust-123',
      },
    });

    expect(result['enhancedSchemeData.itemDetailLine1.discountAmount']).toBe('10');
  });

  
});
