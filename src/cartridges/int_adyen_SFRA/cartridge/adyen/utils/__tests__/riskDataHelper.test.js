const LineItemHelper = require('*/cartridge/adyen/utils/lineItemHelper');
const RiskDataHelper = require('*/cartridge/adyen/utils/riskDataHelper');

describe('createBasketContentFields', () => {
  it('should return correct risk data fields for each product line item', () => {
    const mockItem1 = {
      adjustedNetPrice: { currencyCode: 'USD' },
      product: {
        UPC: '123456789012',
        manufacturerSKU: 'MANU-SKU-001',
        brand: 'TestBrand',
        manufacturerName: 'TestManufacturer',
        primaryCategory: { displayName: 'Electronics' },
      },
    };

    const mockItem2 = {
      adjustedNetPrice: { currencyCode: 'EUR' },
      product: {
        UPC: '987654321098',
        manufacturerSKU: 'MANU-SKU-002',
        brand: 'AnotherBrand',
        manufacturerName: 'AnotherManufacturer',
        primaryCategory: { displayName: 'Books' },
      },
    };

    const mockOrder = {
      getProductLineItems: () => ({
        toArray: () => [mockItem1, mockItem2],
      }),
    };

    LineItemHelper.getQuantity
      .mockReturnValueOnce('2')
      .mockReturnValueOnce('1');
    LineItemHelper.getId
      .mockReturnValueOnce('item-1')
      .mockReturnValueOnce('item-2');
    LineItemHelper.getDescription
      .mockReturnValueOnce('Item One')
      .mockReturnValueOnce('Item Two');
    LineItemHelper.getItemAmount
      .mockReturnValueOnce({
        divide: () => ({ value: { toFixed: () => '100.00' } }),
      })
      .mockReturnValueOnce({
        divide: () => ({ value: { toFixed: () => '200.00' } }),
      });

    const result = RiskDataHelper.createBasketContentFields(mockOrder);

    expect(result).toEqual({
      'riskdata.basket.item1.itemID': 'item-1',
      'riskdata.basket.item1.productTitle': 'Item One',
      'riskdata.basket.item1.amountPerItem': '100.00',
      'riskdata.basket.item1.currency': 'USD',
      'riskdata.basket.item1.upc': '123456789012',
      'riskdata.basket.item1.sku': 'MANU-SKU-001',
      'riskdata.basket.item1.brand': 'TestBrand',
      'riskdata.basket.item1.manufacturer': 'TestManufacturer',
      'riskdata.basket.item1.category': 'Electronics',
      'riskdata.basket.item1.quantity': '2',

      'riskdata.basket.item2.itemID': 'item-2',
      'riskdata.basket.item2.productTitle': 'Item Two',
      'riskdata.basket.item2.amountPerItem': '200.00',
      'riskdata.basket.item2.currency': 'EUR',
      'riskdata.basket.item2.upc': '987654321098',
      'riskdata.basket.item2.sku': 'MANU-SKU-002',
      'riskdata.basket.item2.brand': 'AnotherBrand',
      'riskdata.basket.item2.manufacturer': 'AnotherManufacturer',
      'riskdata.basket.item2.category': 'Books',
      'riskdata.basket.item2.quantity': '1',
    });
  });
});
