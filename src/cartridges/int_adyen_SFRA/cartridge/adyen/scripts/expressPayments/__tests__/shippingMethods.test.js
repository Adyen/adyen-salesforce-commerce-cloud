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
    querystring: {
      city: 'Amsterdam',
      countryCode: 'NL',
      stateCode: 'AMS',
      postalCode: '1001',
      shipmentUUID: 'mocked_uuid',
    },
    locale: { id: 'nl_NL' },
    form: {
      methodID: 'mocked_methodID',
    },
  };

  res = {
    redirect: jest.fn(),
    json: jest.fn(),
  };
});

afterEach(() => {
  jest.resetModules();
});

describe('Shipping methods', () => {
  it('Should return available shipping methods', () => {
    const Logger = require('../../../../../../../../jest/__mocks__/dw/system/Logger');
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
    expect(res.json).not.toHaveBeenCalled();
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
});