const paypalHelper = require('../paypalHelper')
describe('paypalHelper', () => {
  let args,lineItem, result
  beforeEach(() => {
    args = (item) => ({
      Order: {
        getAllLineItems: jest.fn(() => ([item]))
      }
    })

    lineItem = {
      productName: 'test',
      productID: '123',
      quantityValue: '1',
      getAdjustedTax: '1000',
      adjustedNetPrice: '10000',
      category: 'PHYSICAL_GOODS',
    }

    result = {
      quantity: '1',
      description: 'test',
      itemCategory: 'PHYSICAL_GOODS',
      sku: '123',
      amountExcludingTax: '10000',
      taxAmount: '1000'
    }
  })
  it('should return lineItems for paypal', () => {
const paypalLineItems = paypalHelper.getLineItems(args(lineItem))
    expect(paypalLineItems[0]).toStrictEqual(result)
  })

  it('should return lineItems for paypal with default itemCategory when category is not as per paypal', () => {
    const paypalLineItems = paypalHelper.getLineItems(args({...lineItem, category: 'TEST_GOODS'}))
    expect(paypalLineItems[0]).toStrictEqual(result)
  })

  it('should return no lineItems for paypal if order or basket is not defined', () => {

    const paypalLineItems = paypalHelper.getLineItems({})
    expect(paypalLineItems).toBeNull()
  })
})