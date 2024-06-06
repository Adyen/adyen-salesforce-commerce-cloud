/* eslint-disable global-require */
jest.mock('dw/value/Money', () => jest.fn());
jest.mock('*/cartridge/adyen/utils/adyenHelper', () => {
  return {
    getCurrencyValueForApi: jest.fn(() => {
      return {
        value: 1000
      }
    })
  }
})

const paypalHelper = require('../paypalHelper')
const Money = require('dw/value/Money');
describe('paypalHelper', () => {
  describe('getLineItems', () => {
    let args,lineItem, result
    beforeEach(() => {
      jest.clearAllMocks();
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

    afterEach(() => {
      jest.resetModules();
    });

    it('should return lineItems for paypal', () => {
      const paypalLineItems = paypalHelper.getLineItems(args(lineItem))
      expect(paypalLineItems[0]).toStrictEqual(result)
    })

    it('should return lineItems for paypal with default itemCategory when category is not as per paypal', () => {
      const paypalLineItems = paypalHelper.getLineItems(args({...lineItem, category: 'TEST_GOODS'}))
      expect(paypalLineItems[0]).toStrictEqual({
        quantity: '1',
        description: 'test',
        sku: '123',
        amountExcludingTax: '10000',
        taxAmount: '1000'
      })
    })

    it('should return no lineItems for paypal if order or basket is not defined', () => {

      const paypalLineItems = paypalHelper.getLineItems({})
      expect(paypalLineItems).toBeNull()
    })
  })
  describe('createPaypalUpdateOrderRequest', () => {
    let pspReference, currentBasket, currentShippingMethods, paymentData, result;
    beforeEach(() => {
      jest.clearAllMocks();
      pspReference = 'test';
      paymentData = 'test';
      currentShippingMethods = [{
        ID: '001',
        displayName: 'test',
        shippingCost: {
          currencyCode: 'USD',
          value: '10.00',
        },
        selected: true,
      }]
      currentBasket = {
        currencyCode: 'USD',
        getAdjustedShippingTotalGrossPrice: jest.fn(),
        getAdjustedMerchandizeTotalGrossPrice: jest.fn(),
      }

      result = {
        pspReference: 'test',
        paymentData: 'test',
        amount: {
          currency: 'USD',
          value: 2000
        },
        deliveryMethods:[{
          reference: '001',
          description: 'test',
          type: 'Shipping',
          amount: {
            currency: 'USD',
            value: 1000,
          },
          selected: true,
        }],
      }

    })

    it('should return UpdateOrderRequest object for paypal', () => {
      Money.mockReturnValue(() => {return {value: 10, currency: 'TEST'}})
      const paypalUpdateOrderRequest = paypalHelper.createPaypalUpdateOrderRequest(pspReference, currentBasket, currentShippingMethods, paymentData)
      expect(paypalUpdateOrderRequest).toStrictEqual(result)
    })
  })
})

