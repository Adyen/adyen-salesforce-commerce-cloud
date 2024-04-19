const paypalHelper = require('../paypalHelper')
describe('paypalHelper', () => {
  it('should return lineItems for paypal', () => {
const args = {
  Order: {
    getProductLineItems: jest.fn(() => {
      return {
        toArray: jest.fn(() => ([
          {
            productName: 'test',
            productID: '123',
            quantityValue: '1',
            getAdjustedTax: '1000',
            adjustedNetPrice: '10000',
            category: 'PHYSICAL_GOODS',
          }
        ]))
      }
    })
  }
}

const paypalLineItems = paypalHelper.getLineItems(args)
    expect(paypalLineItems[0]).toStrictEqual({
      quantity: '1',
      description: 'test',
      itemCategory: 'PHYSICAL_GOODS',
      sku: '123',
      amountExcludingTax: '10000',
      taxAmount: '1000'
    })
  })

  it('should return lineItems for paypal with default itemCategory when category is not as per paypal', () => {
    const args = {
      Order: {
        getProductLineItems: jest.fn(() => {
          return {
            toArray: jest.fn(() => ([
              {
                productName: 'test',
                productID: '123',
                quantityValue: '2',
                getAdjustedTax: '1000',
                adjustedNetPrice: '10000',
                category: 'TEST_GOODS',
              }
            ]))
          }
        })
      }
    }

    const paypalLineItems = paypalHelper.getLineItems(args)
    expect(paypalLineItems[0]).toStrictEqual({
      quantity: '2',
      description: 'test',
      itemCategory: 'PHYSICAL_GOODS',
      sku: '123',
      amountExcludingTax: '5000',
      taxAmount: '500'
    })
  })

  it('should return no lineItems for paypal if order or basket is not defined', () => {

    const paypalLineItems = paypalHelper.getLineItems({})
    expect(paypalLineItems).toBeNull()
  })
})