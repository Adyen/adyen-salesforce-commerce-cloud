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

const {
  getLineItems,
} = require('*/cartridge/adyen/scripts/payments/adyenLevelTwoThreeData');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');

describe('getLineItems (Enhanced Scheme Data)', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

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

  it('should return enhanced scheme data with tax, description, and commodity code', () => {
    const result = getLineItems({
      Order: createMockOrderOrBasket({
        registered: true,
        customerNo: 'cust-9999',
      }),
    });

    expect(result).toEqual({
      levelTwoThree: {
        customerReferenceNumber: 'cust-9999',
        totalTaxAmount: 20,
        itemDetailLines: [
          {
            unitPrice: 50,
            totalAmount: 100,
            quantity: 2,
            unitOfMeasure: 'EAC',
            commodityCode: 'mocked_comodity_code',
            description: 'Super Widget',
            productCode: 'SW1234567890',
          },
        ],
      },
    });
  });

  it('should truncate customerReferenceNumber to 25 characters', () => {
    const longCustomerNo = 'very-long-customer-number-1234567890';
    const result = getLineItems({
      Order: createMockOrderOrBasket({
        registered: true,
        customerNo: longCustomerNo,
      }),
    });

    expect(
      result.levelTwoThree.customerReferenceNumber.length,
    ).toBeLessThanOrEqual(25);
  });

  it('should return null when no Order or Basket is passed', () => {
    expect(getLineItems({})).toBeNull();
  });

  it('should fallback to getCustomer().getID() if no profile or customerNo', () => {
    const result = getLineItems({
      Basket: createMockOrderOrBasket({ customerId: 'anon-user' }),
    });

    expect(result.levelTwoThree.customerReferenceNumber).toBe('anon-user');
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
          getID: () => null,
        }),
        getCustomerNo: () => null,
      },
    });

    expect(result.levelTwoThree.customerReferenceNumber).toBe('no-unique-ref');
  });

  it('should append shipping line items to itemDetailLines', () => {
    const shippingLineItem = {
      productName: 'Ground shipping',
      productID: 'SHIP001',
      quantityValue: 1,
      adjustedNetPrice: 10,
      getAdjustedTax: 2,
    };
    const orderOrBasket = createMockOrderOrBasket();
    orderOrBasket.getShipments = () => ({
      toArray: () => [
        { getShippingLineItems: () => ({ toArray: () => [shippingLineItem] }) },
      ],
    });

    const result = getLineItems({ Order: orderOrBasket });

    expect(result.levelTwoThree.itemDetailLines).toHaveLength(2);
    expect(result.levelTwoThree.itemDetailLines[1]).toEqual(
      expect.objectContaining({
        description: 'Ground shipping',
        productCode: 'SHIP001',
        totalAmount: 10,
        unitPrice: 10,
        quantity: 1,
      }),
    );
    expect(result.levelTwoThree.totalTaxAmount).toBe(22);
  });

  it('should fall back to a quantity of 1 when the quantity is not numeric', () => {
    const orderOrBasket = createMockOrderOrBasket();
    orderOrBasket.getProductLineItems = () => ({
      toArray: () => [{ ...mockLineItem, quantityValue: null }],
    });

    const result = getLineItems({ Order: orderOrBasket });

    expect(result.levelTwoThree.itemDetailLines[0].quantity).toBe(1);
    expect(result.levelTwoThree.itemDetailLines[0].unitPrice).toBe(100);
  });

  it('should omit discountAmount when the line has no price reduction', () => {
    const lineItemHelper = require('*/cartridge/adyen/utils/lineItemHelper');
    lineItemHelper.isProductLineItem.mockReturnValueOnce(true);

    const undiscountedLineItem = {
      ...mockLineItem,
      basePrice: {
        value: 50,
        multiply: jest.fn(() => ({ value: 100 })),
      },
      adjustedPrice: { value: 100 },
    };
    const orderOrBasket = createMockOrderOrBasket();
    orderOrBasket.getProductLineItems = () => ({
      toArray: () => [undiscountedLineItem],
    });

    const result = getLineItems({ Order: orderOrBasket });

    expect(
      'discountAmount' in result.levelTwoThree.itemDetailLines[0],
    ).toBe(false);
  });

  it('should include discount amount when product has basePrice > adjustedPrice', () => {
    const lineItemHelper = require('*/cartridge/adyen/utils/lineItemHelper');
    lineItemHelper.isProductLineItem.mockReturnValueOnce(true);

    jest.spyOn(AdyenHelper, 'getCurrencyValueForApi').mockReturnValue({
      value: { toFixed: () => '20' },
    });

    // qty=2, basePrice=60/unit (line=120), adjustedPrice=100 (line total).
    // Expected total line discount = 60*2 - 100 = 20.
    const discountedLineItem = {
      ...mockLineItem,
      basePrice: {
        value: 60,
        multiply: jest.fn(() => ({
          value: 120,
          subtract: jest.fn(() => ({
            value: 20,
          })),
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

    // Total line discount (not per-unit). Adyen formula:
    // totalAmount = quantity * unitPrice - discountAmount => 100 = 2 * 60 - 20
    const [itemDetailLine] = result.levelTwoThree.itemDetailLines;
    expect(itemDetailLine.discountAmount).toBe(20);
    expect(itemDetailLine.unitPrice).toBe(60);
    expect(itemDetailLine.totalAmount).toBe(100);
  });
});
