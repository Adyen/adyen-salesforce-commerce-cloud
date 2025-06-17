const {getLineItems} = require('*/cartridge/adyen/scripts/payments/adyenGetOpenInvoiceData'); 

describe('getLineItems', () => {
  const mockLineItem = {
    productName: 'Test Product',
    productID: 'test123',
    quantityValue: 2,
    adjustedNetPrice: 100, 
    getAdjustedTax: 20,
	vatRate: '0.2'
  };

  const createOrderOrBasket = () => ({
    getAllLineItems: () => [mockLineItem],
  });

  it('should return correct line item object when addTaxPercentage is true', () => {
    const result = getLineItems({
      Order: createOrderOrBasket(),
      addTaxPercentage: true,
    });

    expect(result).toEqual([
      {
        amountExcludingTax: '50',
        taxAmount: '10',
        amountIncludingTax: 60,
        description: 'Test Product',
        id: 'test123',
        quantity: 2,
        taxPercentage: '2000',
      },
    ]);
  });

  it('should return correct line item object when addTaxPercentage is false', () => {
    const result = getLineItems({
      Basket: createOrderOrBasket(),
      addTaxPercentage: false,
    });

    expect(result[0].taxPercentage).toBe(0);
  });

  it('should return null if no order or basket is passed', () => {
    const result = getLineItems({});
    expect(result).toBeNull();
  });
});
