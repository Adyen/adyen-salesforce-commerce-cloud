/* eslint-disable global-require */
const Money = require('../../../../../../../jest/__mocks__/dw/value/Money');
const { getApplicableShippingMethods, getTerminalApiEnvironment, getCheckoutEnvironment } = require('../adyenHelper');
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
    expect(paymentInstrument.paymentTransaction.custom.Adyen_paymentMethod).toBe('mc');
    expect(order.custom.Adyen_paymentMethod).toBe('mc');
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

	  it('should return LIVE NEA endpoint for LIVE environment with NEA region', () => {
		const adyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
		adyenConfigs.getAdyenEnvironment.mockReturnValue('LIVE');
		adyenConfigs.getAdyenPosRegion.mockReturnValue('NEA');
		const result = getTerminalApiEnvironment();
		expect(result).toBe('live-nea');
	  });
  })

describe('getCheckoutEnvironment', () => {
  it('should return LIVE NEA endpoint for LIVE environment with NEA region', () => {
    const adyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
    adyenConfigs.getAdyenEnvironment.mockReturnValue('LIVE');
    adyenConfigs.getAdyenFrontendRegion.mockReturnValue('NEA');
    const result = getCheckoutEnvironment();
    expect(result).toBe('live-nea');
  });
});

describe('executeCall', () => {
  const adyenHelper = require('../adyenHelper');
  const constants = require('*/cartridge/adyen/config/constants');
  let service;
  let callResult;

  const getSentBody = (nthCall = 0) =>
    JSON.parse(service.call.mock.calls[nthCall][0]);

  beforeEach(() => {
    jest.clearAllMocks();
    const adyenConfigs = require('*/cartridge/adyen/utils/adyenConfigs');
    adyenConfigs.getAdyenEnvironment.mockReturnValue('TEST');
    callResult = {
      isOk: jest.fn(() => true),
      object: { getText: jest.fn(() => '{"resultCode":"Authorised"}') },
      getError: jest.fn(() => 500),
      getStatus: jest.fn(() => 'ERROR'),
      getErrorMessage: jest.fn(() => ''),
      getMsg: jest.fn(() => ''),
    };
    service = {
      getURL: jest.fn(
        () => 'https://checkout-test.adyen.com/[CHECKOUT_API_VERSION]/payments',
      ),
      setURL: jest.fn(),
      addHeader: jest.fn(),
      call: jest.fn(() => callResult),
    };
    jest.spyOn(adyenHelper, 'getService').mockReturnValue(service);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('sends the sanitized request body', () => {
    adyenHelper.executeCall(constants.SERVICE.PAYMENT, {
      reference: '00001202',
      shopperIP: 'i'.repeat(300),
      shopperEmail: '  shopper@example.com  ',
    });

    expect(getSentBody().shopperIP).toBe('i'.repeat(256));
    expect(getSentBody().shopperEmail).toBe('shopper@example.com');
  });

  it('does not mutate the request object it was given', () => {
    const requestObject = { shopperIP: 'i'.repeat(300) };

    adyenHelper.executeCall(constants.SERVICE.PAYMENT, requestObject);

    expect(requestObject.shopperIP).toBe('i'.repeat(300));
  });

  it('sanitizes once and re-sends the identical body on every retry', () => {
    callResult.isOk.mockReturnValue(false);

    expect(() =>
      adyenHelper.executeCall(constants.SERVICE.PAYMENT, {
        shopperIP: 'i'.repeat(300),
      }),
    ).toThrow();

    expect(service.call).toHaveBeenCalledTimes(constants.MAX_API_RETRIES);
    const [firstBody] = service.call.mock.calls[0];
    service.call.mock.calls.forEach(([body]) => expect(body).toBe(firstBody));
  });

  it('substitutes the checkout API version placeholder', () => {
    adyenHelper.executeCall(constants.SERVICE.PAYMENT, {});

    expect(service.setURL).toHaveBeenCalledWith(
      `https://checkout-test.adyen.com/${constants.CHECKOUT_API_VERSION}/payments`,
    );
  });
});

describe('createAddressObjects', () => {
  const { createAddressObjects } = require('../adyenHelper');

  const buildAddress = (stateCode) => ({
    address1: 'Simon Carmiggeltstraat 6',
    city: 'Amsterdam',
    postalCode: '1011DJ',
    countryCode: { value: 'nl' },
    stateCode,
  });

  const buildOrder = (shippingStateCode, billingStateCode) => ({
    defaultShipment: { shippingAddress: buildAddress(shippingStateCode) },
    getBillingAddress: () => buildAddress(billingStateCode),
  });

  it('includes stateOrProvince when the address has a stateCode', () => {
    const paymentRequest = createAddressObjects(
      buildOrder('NH', 'ZH'),
      'scheme',
      {},
    );

    expect(paymentRequest.deliveryAddress.stateOrProvince).toBe('NH');
    expect(paymentRequest.billingAddress.stateOrProvince).toBe('ZH');
  });

  it('falls back to N/A when the address has no stateCode', () => {
    const paymentRequest = createAddressObjects(
      buildOrder(null, undefined),
      'scheme',
      {},
    );

    expect(paymentRequest.deliveryAddress.stateOrProvince).toBe('N/A');
    expect(paymentRequest.billingAddress.stateOrProvince).toBe('N/A');
  });

  it('falls back to N/A when the stateCode is an empty string', () => {
    const paymentRequest = createAddressObjects(
      buildOrder('', ''),
      'scheme',
      {},
    );

    expect(paymentRequest.deliveryAddress.stateOrProvince).toBe('N/A');
    expect(paymentRequest.billingAddress.stateOrProvince).toBe('N/A');
  });

  it('keeps the N/A fallbacks for the other address fields', () => {
    const order = buildOrder('NH', 'ZH');
    order.defaultShipment.shippingAddress.address1 = null;
    order.defaultShipment.shippingAddress.city = null;

    const paymentRequest = createAddressObjects(order, 'scheme', {});

    expect(paymentRequest.deliveryAddress.street).toBe('N/A');
    expect(paymentRequest.deliveryAddress.city).toBe('N/A');
  });
});

describe('validateStateData', () => {
  const { validateStateData } = require('../adyenHelper');

  it('strips conversionId, which v72 removed from the request', () => {
    const { stateData, invalidFields } = validateStateData({
      paymentMethod: { type: 'scheme' },
      conversionId: 'abc',
    });

    expect(stateData.conversionId).toBeUndefined();
    expect(invalidFields).toContain('conversionId');
  });

  it('keeps a component-supplied deliveryAddress now that the key matches', () => {
    const deliveryAddress = { city: 'Amsterdam', country: 'NL' };
    const { stateData, invalidFields } = validateStateData({
      paymentMethod: { type: 'scheme' },
      deliveryAddress,
    });

    expect(stateData.deliveryAddress).toEqual(deliveryAddress);
    expect(invalidFields).toHaveLength(0);
  });

  it('keeps the whitelisted fields', () => {
    const { stateData, invalidFields } = validateStateData({
      paymentMethod: { type: 'scheme' },
      billingAddress: { city: 'Amsterdam' },
      shopperEmail: 'shopper@example.com',
      browserInfo: { userAgent: 'jest' },
    });

    expect(Object.keys(stateData)).toEqual([
      'paymentMethod',
      'billingAddress',
      'shopperEmail',
      'browserInfo',
    ]);
    expect(invalidFields).toHaveLength(0);
  });
});