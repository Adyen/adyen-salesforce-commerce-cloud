/* eslint-disable global-require */
const BasketMgr = require('dw/order/BasketMgr');
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
const { createBillingAddress } = require("../../../../../../../jest/__mocks__/dw/order/BasketMgr");
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
      }

      result = {
        pspReference: 'test',
        paymentData: 'test',
        amount: {
          currency: 'USD',
          value: 1000
        },
        taxTotal: {
          amount: {
            currency: 'USD',
            value: 1000
          }
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
  describe('setBillingAndShippingAddress', () => {
    let shopperDetails, billingAddress, shippingAddress;
    beforeEach(() => {
      jest.clearAllMocks();
      billingAddress = require('../../../../../../../jest/__mocks__/dw/order/BasketMgr');
      shopperDetails = {
        shopperName:{
          firstName: 'John',
          lastName: 'Doe'
        },
        billingAddress:{
          shopperName:{
            firstName: 'John',
            lastName: 'Doe'
          },
          street: '123 Main St',
          city: 'City',
          postalCode: '12345',
          stateOrProvince: 'State',
          country: 'United States',
        },
        shippingAddress:{
          shopperName:{
            firstName: 'John',
            lastName: 'Doe'
          },
          street: '123 Main St',
          city: 'City',
          postalCode: '12345',
          stateOrProvince: 'State',
          country: 'United States',
        },
        telephoneNumber: '+1234567890',
        shopperEmail: 'john@example.com'
      }
    });
    afterEach(() => {
      jest.resetModules();
    });
    it('should update billing and shipping address for current basket', () => {
      const currentBasket = BasketMgr.getCurrentBasket();
      paypalHelper.setBillingAndShippingAddress(currentBasket, shopperDetails);
      expect(currentBasket.billingAddress.setFirstName).toHaveBeenCalledWith('John');
    })
    it('should set billing and shipping address if current basket has no billing Address', () => {
      const currentBasket = BasketMgr.getCurrentBasket();
      currentBasket.billingAddress= '';
      paypalHelper.setBillingAndShippingAddress(currentBasket, shopperDetails);
      expect(currentBasket.createBillingAddress).toHaveBeenCalled();
    })
    it('should set billing and shipping address if current basket has no shipping Address', () => {
      const currentBasket = BasketMgr.getCurrentBasket();
      const createShippingAddress = jest.fn(() => ({
        setPostalCode: jest.fn(),
        setAddress1: jest.fn(),
        setAddress2: jest.fn(),
        setCountryCode: jest.fn(),
        setCity: jest.fn(),
        setFirstName: jest.fn(),
        setLastName: jest.fn(),
        setPhone: jest.fn(),
        setStateCode: jest.fn(),
      }));
      currentBasket.getDefaultShipment= jest.fn(() => ({
        createShippingAddress: createShippingAddress
      }));
      paypalHelper.setBillingAndShippingAddress(currentBasket, shopperDetails);
      expect(currentBasket.getDefaultShipment).toHaveBeenCalled();
      expect(createShippingAddress).toHaveBeenCalled();
    })
  })
})

