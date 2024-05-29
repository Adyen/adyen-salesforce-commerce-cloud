/* eslint-disable global-require */
const AdyenHelper = require('*/cartridge/adyen/utils/adyenHelper');

let res;
let req;
const next = jest.fn();

const callGetShippingMethods = require('../shippingMethods');

beforeEach(() => {
  jest.clearAllMocks();

  req = {
    body: JSON.stringify({address:{
      city: 'Amsterdam',
      countryCode: 'NL',
      stateCode: 'AMS',
      shipmentUUID: 'mocked_uuid',
    }}),
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
