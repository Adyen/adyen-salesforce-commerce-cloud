/* eslint-disable global-require */
const Money = require('../../../../../../../jest/__mocks__/dw/value/Money');
const { getApplicableShippingMethods, getTerminalApiEnvironment } = require('../adyenHelper');
const savePaymentDetails = require('../adyenHelper').savePaymentDetails;
describe('savePaymentDetails', () => {
  let paymentInstrument;
  let order;
  let result;

  beforeEach(() => {
	  paymentInstrument = {
      paymentTransaction: {
        custom: {}
      },
      getCreditCardToken: jest.fn(),
      setCreditCardToken: jest.fn()
    };
    order = {
      custom: {}
    };
    result = {};
  });

  it('should set the transactionID and Adyen_pspReference', () => {
    result.pspReference = 'testReference';
    savePaymentDetails(paymentInstrument, order, result);
    expect(paymentInstrument.paymentTransaction.transactionID).toBe('testReference');
    expect(paymentInstrument.paymentTransaction.custom.Adyen_pspReference).toBe('testReference');
  });

  it('should set Adyen_paymentMethod from additionalData', () => {
    result.additionalData = { paymentMethod: 'visa' };
    savePaymentDetails(paymentInstrument, order, result);
    expect(paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod).toBe('visa');
    expect(order.custom.Adyen_paymentMethod).toBe('visa');
  });

  it('should set Adyen_paymentMethod from paymentMethod', () => {
    result.paymentMethod = { type: 'mc' };
    savePaymentDetails(paymentInstrument, order, result);
    expect(paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod).toBe(JSON.stringify('mc'));
    expect(order.custom.Adyen_paymentMethod).toBe(JSON.stringify('mc'));
  });

  it('should set the credit card token if not already exists', () => {
    result.additionalData = { 'recurring.recurringDetailReference': 'token123' };
    paymentInstrument.getCreditCardToken.mockReturnValue(null);
    savePaymentDetails(paymentInstrument, order, result);
    expect(paymentInstrument.setCreditCardToken).toHaveBeenCalledWith('token123');
  });

  it('should not set the credit card token if already exists', () => {
    result.additionalData = { 'recurring.recurringDetailReference': 'token123' };
    paymentInstrument.getCreditCardToken.mockReturnValue('existingToken');
    savePaymentDetails(paymentInstrument, order, result);
    expect(paymentInstrument.setCreditCardToken).not.toHaveBeenCalled();
  });

  it('should set the authCode and Adyen_value', () => {
    result.resultCode = 'Authorised';
    savePaymentDetails(paymentInstrument, order, result);
    expect(paymentInstrument.paymentTransaction.custom.authCode).toBe('Authorised');
    expect(order.custom.Adyen_value).toBe('0');
  });

  it('should set Adyen_donationToken if present', () => {
    result.donationToken = 'donation-token-123';
    savePaymentDetails(paymentInstrument, order, result);
    expect(paymentInstrument.paymentTransaction.custom.Adyen_donationToken).toBe('donation-token-123');
  });
});

describe('getApplicableShippingMethods', () => {
  let shippingMethod, shipment, address;
  beforeEach(() => {
    shippingMethod = {
      description: 'Order received within 7-10 business days',
      displayName: 'Ground',
      ID: '001',
      custom: {
        estimatedArrivalTime: '7-10 Business Days'
      },
      getTaxClassID: jest.fn(),
    };
    shipment = {
      UUID: 'mock_UUID',
      shippingAddress: {
        setCity: jest.fn(),
        setPostalCode: jest.fn(),
        setStateCode: jest.fn(),
        setCountryCode: jest.fn(),
      },
      getProductLineItems: jest.fn(() => ({
        toArray: jest.fn(() =>[{
          getProduct: jest.fn(() => ({
            getPriceModel: jest.fn(() => ({
              getPrice: jest.fn(() => Money())
            }))
          })),
          getQuantity: jest.fn()
        }])
      }))
    };
    address = {}
  });
  it('should return applicable shipping methods for shipment and address', () => {
    const shippingMethods = getApplicableShippingMethods(shipment, address);
    expect(shippingMethods).toStrictEqual([{"shipmentUUID": "mock_UUID", "shippingCost": {"currencyCode": "USD", "value": "10.99"}}, {"shipmentUUID": "mock_UUID", "shippingCost": {"currencyCode": "USD", "value": "10.99"}}]);
  })
  it('should return applicable shipping methods when address is not provided', () => {
    const shippingMethods = getApplicableShippingMethods(shipment);
    expect(shippingMethods).toStrictEqual([{"shipmentUUID": "mock_UUID", "shippingCost": {"currencyCode": "USD", "value": "10.99"}}, {"shipmentUUID": "mock_UUID", "shippingCost": {"currencyCode": "USD", "value": "10.99"}}]);
  })
  it('should return no shipping methods when shipment is not provided', () => {
    const shippingMethods = getApplicableShippingMethods();
    expect(shippingMethods).toBeNull();
  })
})

describe('getTerminalApiEnvironment', () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});
	it('should return TEST endpoint for TEST environment', () => {
		const adyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
		adyenConfigs.getAdyenEnvironment.mockReturnValue('TEST');
		const result = getTerminalApiEnvironment();
		expect(result).toBe('test');
	  });

	it('should return LIVE US endpoint for LIVE environment', () => {
		const adyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
		adyenConfigs.getAdyenEnvironment.mockReturnValue('LIVE');
		adyenConfigs.getAdyenPosRegion.mockReturnValue('US');
		const result = getTerminalApiEnvironment();
		expect(result).toBe('live-us');
	  });

	  it('should return default LIVE endpoint for LIVE environment', () => {
		const adyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
		adyenConfigs.getAdyenEnvironment.mockReturnValue('LIVE');
		adyenConfigs.getAdyenPosRegion.mockReturnValue('EU');
		const result = getTerminalApiEnvironment();
		expect(result).toBe('live');
	  });
  })