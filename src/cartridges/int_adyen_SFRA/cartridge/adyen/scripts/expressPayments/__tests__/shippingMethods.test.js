/* eslint-disable global-require */
const BasketMgr = require('dw/order/BasketMgr');
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');

let res;
let req;
const next = jest.fn();

const callGetShippingMethods = require('../shippingMethods');
const Logger = require("../../../../../../../../jest/__mocks__/dw/system/Logger");

beforeEach(() => {
  jest.clearAllMocks();

  req = {
    form: {
      data: JSON.stringify({address:{
          city: 'Amsterdam',
          countryCode: 'NL',
          stateCode: 'AMS',
          postalCode: '1001',
          shipmentUUID: 'mocked_uuid',
        }})
    },
  };

  res = {
    redirect: jest.fn(),
    json: jest.fn(),
    setStatusCode: jest.fn(),
  };
});

afterEach(() => {
  jest.resetModules();
});

describe('Shipping methods', () => {
  it('Should return available shipping methods', () => {
    const Logger = require('../../../../../../../../jest/__mocks__/dw/system/Logger');
    currentBasket = {
      getDefaultShipment: jest.fn(() => {
        return {
          shippingAddress: {
            setCity: jest.fn(),
            setPostalCode: jest.fn(),
            setStateCode: jest.fn(),
            setCountryCode: jest.fn(),
          }}
      }),
      getTotalGrossPrice: jest.fn(() => {
        return {
          currencyCode: 'EUR',
          value: '1000'
        }
      }),
      updateTotals: jest.fn(),
	  getShipments: jest.fn(() => ({
		toArray: jest.fn(() => [
		  {
			shippingAddress: {
			  getCountryCode: jest.fn(() => ({ value: 'NL' })),
			},
		  },
		]),
	  })),
    };
    BasketMgr.getCurrentBasket.mockReturnValueOnce(currentBasket);
    callGetShippingMethods(req, res, next);
    expect(AdyenHelper.getApplicableShippingMethods).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      shippingMethods: ['mocked_shippingMethods'],
    });
    expect(Logger.error.mock.calls.length).toBe(0);
  });

  it('Should fail returning available shipping methods', () => {
    const Logger = require('../../../../../../../../jest/__mocks__/dw/system/Logger');
    AdyenHelper.getApplicableShippingMethods = jest.fn(
      new Logger.error('error'),
    );
    callGetShippingMethods(req, res, next);
    expect(res.setStatusCode).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      errorMessage: 'mocked_error.cannot.find.shipping.methods',
    });
    expect(next).toHaveBeenCalled();
  });
});

it('Should update shipping address for the basket', () => {
  const Logger = require('../../../../../../../../jest/__mocks__/dw/system/Logger');
  const setCityMock = jest.fn()
  const setPostalCodeMock = jest.fn()
  const setStateCodeMock = jest.fn()
  const setCountryCodeMock = jest.fn()
  const currentBasketMock = {
    getDefaultShipment: jest.fn(() =>({
      createShippingAddress: jest.fn(() => ({
        setCity: setCityMock,
        setPostalCode: setPostalCodeMock,
        setStateCode: setStateCodeMock,
        setCountryCode: setCountryCodeMock
      }))
    })),
  };
  BasketMgr.getCurrentBasket.mockReturnValueOnce(currentBasketMock);
  callGetShippingMethods(req, res, next);
  expect(setCityMock).toHaveBeenCalledWith('Amsterdam');
  expect(setPostalCodeMock).toHaveBeenCalledWith('1001');
  expect(setStateCodeMock).toHaveBeenCalledWith('AMS');
  expect(setCountryCodeMock).toHaveBeenCalledWith('NL');
  expect(Logger.error.mock.calls.length).toBe(0);
});
