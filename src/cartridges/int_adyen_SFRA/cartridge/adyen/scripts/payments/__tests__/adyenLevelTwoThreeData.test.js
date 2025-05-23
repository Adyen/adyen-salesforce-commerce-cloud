const { getLineItems } = require('*/cartridge/adyen/scripts/payments/adyenLevelTwoThreeData');
const AdyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');

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
      'enhancedSchemeData.itemDetailLine1.totalAmount': 60, 
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
        getCustomer: () => ({
          getID: () => null
        }),
        getCustomerNo: () => null,
      },
    });

    expect(result['enhancedSchemeData.customerReference']).toBe('no-unique-ref');
  });
});
