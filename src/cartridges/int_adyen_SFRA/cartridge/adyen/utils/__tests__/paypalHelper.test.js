/* eslint-disable global-require */
const BasketMgr = require('dw/order/BasketMgr');
jest.mock('dw/value/Money', () => jest.fn());
jest.mock('*/cartridge/adyen/utils/adyenHelper', () => {
  return {
    getCurrencyValueForApi: jest.fn(() => {
      return {
        value: 1000,
      };
    }),
  };
});
jest.mock('dw/order/TaxMgr', () => ({
  TAX_POLICY_GROSS: 0,
  TAX_POLICY_NET: 1,
  taxationPolicy: 1, // net by default; override per test
}));
const TaxMgr = require('dw/order/TaxMgr');

const paypalHelper = require('../paypalHelper');
const Money = require('dw/value/Money');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');
const {
  createBillingAddress,
} = require('../../../../../../../jest/__mocks__/dw/order/BasketMgr');
describe('paypalHelper', () => {
  describe('getLineItems', () => {
    let args, lineItem, result;
    beforeEach(() => {
      jest.clearAllMocks();
      args = (item) => ({
        Order: {
          getAllLineItems: jest.fn(() => [item]),
        },
      });

      lineItem = {
        productName: 'test',
        productID: '123',
        quantityValue: '1',
        getAdjustedTax: '1000',
        adjustedNetPrice: '10000',
        category: 'PHYSICAL_GOODS',
      };

      result = {
        quantity: '1',
        description: 'test',
        itemCategory: 'PHYSICAL_GOODS',
        sku: '123',
        amountExcludingTax: '10000',
        taxAmount: '1000',
      };
    });

    afterEach(() => {
      jest.resetModules();
    });

    it('should return lineItems for paypal', () => {
      const paypalLineItems = paypalHelper.getLineItems(args(lineItem));
      expect(paypalLineItems[0]).toStrictEqual(result);
    });

    it('should return lineItems for paypal with default itemCategory when category is not as per paypal', () => {
      const paypalLineItems = paypalHelper.getLineItems(
        args({ ...lineItem, category: 'TEST_GOODS' }),
      );
      expect(paypalLineItems[0]).toStrictEqual({
        quantity: '1',
        description: 'test',
        sku: '123',
        amountExcludingTax: '10000',
        taxAmount: '1000',
      });
    });

    it('should return no lineItems for paypal if order or basket is not defined', () => {
      const paypalLineItems = paypalHelper.getLineItems({});
      expect(paypalLineItems).toBeNull();
    });
  });
  describe('createPaypalUpdateOrderRequest', () => {
    let pspReference,
      currentBasket,
      currentShippingMethods,
      paymentData,
      result;
    beforeEach(() => {
      jest.clearAllMocks();
      pspReference = 'test';
      paymentData = 'test';
      currentShippingMethods = [
        {
          ID: '001',
          displayName: 'test',
          shippingCost: {
            currencyCode: 'USD',
            value: '10.00',
          },
          selected: true,
        },
      ];
      currentBasket = {
        currencyCode: 'USD',
        getTotalGrossPrice: jest.fn(() => ({ value: 1000 })),
      };

      result = {
        pspReference: 'test',
        paymentData: 'test',
        amount: {
          currency: 'USD',
          value: 1000,
        },
        taxTotal: {
          amount: {
            currency: 'USD',
            value: 1000,
          },
        },
        deliveryMethods: [
          {
            reference: '001',
            description: 'test',
            type: 'Shipping',
            amount: {
              currency: 'USD',
              value: 1000,
            },
            selected: true,
          },
        ],
      };
    });

    it('should return UpdateOrderRequest object for paypal', () => {
      Money.mockReturnValue(() => {
        return { value: 10, currency: 'TEST' };
      });
      const paypalUpdateOrderRequest =
        paypalHelper.createPaypalUpdateOrderRequest(
          pspReference,
          currentBasket,
          currentShippingMethods,
          paymentData,
        );
      expect(paypalUpdateOrderRequest).toStrictEqual(result);
    });

    it('on a gross-price site should subtract shipping tax from taxTotal', () => {
      TaxMgr.taxationPolicy = TaxMgr.TAX_POLICY_GROSS;

      currentBasket = {
        currencyCode: 'USD',
        getTotalGrossPrice: jest.fn(() => ({ value: 122 })),
        totalTax: { value: 12 },
        shippingTotalTax: { value: 2 },
      };

      currentShippingMethods = [
        {
          ID: '001',
          displayName: 'Ground',
          shippingCost: { currencyCode: 'USD', value: 12 },
          selected: true,
        },
        {
          ID: '002',
          displayName: 'Express',
          shippingCost: { currencyCode: 'USD', value: 24 },
          selected: false,
        },
      ];

      AdyenHelper.getCurrencyValueForApi = jest.fn((money) => ({
        value: money.value ?? money,
      }));

      const result = paypalHelper.createPaypalUpdateOrderRequest(
        pspReference,
        currentBasket,
        currentShippingMethods,
        paymentData,
      );

      // On gross sites, taxTotal should be totalTax - shippingTotalTax (12 - 2 = 10)
      expect(result.taxTotal.amount.value).toBe(10);

      // All methods use catalog pricing
      expect(Money).toHaveBeenCalledWith(12, 'USD');
      expect(Money).toHaveBeenCalledWith(24, 'USD');
    });

    it('on a net-price site should not modify taxTotal', () => {
      TaxMgr.taxationPolicy = TaxMgr.TAX_POLICY_NET;

      currentBasket = {
        currencyCode: 'USD',
        getTotalGrossPrice: jest.fn(() => ({ value: 120 })),
        totalTax: { value: 10 },
        shippingTotalTax: { value: 0 },
      };

      currentShippingMethods = [
        {
          ID: '001',
          displayName: 'Ground',
          shippingCost: { currencyCode: 'USD', value: 10 },
          selected: true,
        },
        {
          ID: '002',
          displayName: 'Express',
          shippingCost: { currencyCode: 'USD', value: 20 },
          selected: false,
        },
      ];

      AdyenHelper.getCurrencyValueForApi = jest.fn((money) => ({
        value: money.value ?? money,
      }));

      const result = paypalHelper.createPaypalUpdateOrderRequest(
        pspReference,
        currentBasket,
        currentShippingMethods,
        paymentData,
      );

      // On net sites, taxTotal equals totalTax unchanged
      expect(result.taxTotal.amount.value).toBe(10);

      // All methods use catalog pricing
      expect(Money).toHaveBeenCalledWith(10, 'USD');
      expect(Money).toHaveBeenCalledWith(20, 'USD');
    });

    it('should ensure at least one delivery method is selected when none are marked', () => {
      TaxMgr.taxationPolicy = TaxMgr.TAX_POLICY_NET;

      currentBasket = {
        currencyCode: 'USD',
        getTotalGrossPrice: jest.fn(() => ({ value: 110 })),
        totalTax: { value: 10 },
        shippingTotalTax: { value: 0 },
      };

      currentShippingMethods = [
        {
          ID: '001',
          displayName: 'Ground',
          shippingCost: { currencyCode: 'USD', value: 10 },
          selected: false,
        },
        {
          ID: '002',
          displayName: 'Express',
          shippingCost: { currencyCode: 'USD', value: 20 },
          selected: false,
        },
      ];

      AdyenHelper.getCurrencyValueForApi = jest.fn((money) => ({
        value: money.value ?? money,
      }));

      const result = paypalHelper.createPaypalUpdateOrderRequest(
        pspReference,
        currentBasket,
        currentShippingMethods,
        paymentData,
      );

      // First method should be auto-selected
      expect(result.deliveryMethods[0].selected).toBe(true);
      expect(result.deliveryMethods[1].selected).toBe(false);
    });
  });
  describe('setBillingAndShippingAddress', () => {
    let shopperDetails, billingAddress, shippingAddress;
    beforeEach(() => {
      jest.clearAllMocks();
      billingAddress = require('../../../../../../../jest/__mocks__/dw/order/BasketMgr');
      shopperDetails = {
        shopperName: {
          firstName: 'John',
          lastName: 'Doe',
        },
        billingAddress: {
          shopperName: {
            firstName: 'John',
            lastName: 'Doe',
          },
          street: '123 Main St',
          city: 'City',
          postalCode: '12345',
          stateOrProvince: 'State',
          country: 'United States',
        },
        shippingAddress: {
          shopperName: {
            firstName: 'John',
            lastName: 'Doe',
          },
          street: '123 Main St',
          city: 'City',
          postalCode: '12345',
          stateOrProvince: 'State',
          country: 'United States',
        },
        telephoneNumber: '+1234567890',
        shopperEmail: 'john@example.com',
      };
    });
    afterEach(() => {
      jest.resetModules();
    });
    it('should update billing and shipping address for current basket', () => {
      const currentBasket = BasketMgr.getCurrentBasket();
      paypalHelper.setBillingAndShippingAddress(currentBasket, shopperDetails);
      expect(currentBasket.billingAddress.setFirstName).toHaveBeenCalledWith(
        'John',
      );
    });
    it('should set billing and shipping address if current basket has no billing Address', () => {
      const currentBasket = BasketMgr.getCurrentBasket();
      currentBasket.billingAddress = '';
      paypalHelper.setBillingAndShippingAddress(currentBasket, shopperDetails);
      expect(currentBasket.createBillingAddress).toHaveBeenCalled();
    });
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
      currentBasket.getDefaultShipment = jest.fn(() => ({
        createShippingAddress: createShippingAddress,
      }));
      paypalHelper.setBillingAndShippingAddress(currentBasket, shopperDetails);
      expect(currentBasket.getDefaultShipment).toHaveBeenCalled();
      expect(createShippingAddress).toHaveBeenCalled();
    });
  });
});
