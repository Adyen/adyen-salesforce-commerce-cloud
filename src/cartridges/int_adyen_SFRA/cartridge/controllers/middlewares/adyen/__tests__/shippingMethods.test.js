/* eslint-disable global-require */
const AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

let res;
let req;
const next = jest.fn();

const callGetShippingMethods = require('../shippingMethods');

beforeEach(() => {
  jest.clearAllMocks();

  req = {
    querystring: {
      city: 'Amsterdam',
      countryCode: 'NL',
      stateCode: 'AMS',
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
    var Logger = require('../../../../../../../../jest/__mocks__/dw/system/Logger');
    callGetShippingMethods(req, res, next);
    expect(AdyenHelper.getApplicableShippingMethods).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      shippingMethods: ['mocked_shippingMethods'],
    });
    expect(Logger.error.mock.calls.length).toBe(0);
  });

  it('Should fail returning available shipping methods', () => {
    var Logger = require('../../../../../../../../jest/__mocks__/dw/system/Logger');
    AdyenHelper.getApplicableShippingMethods = jest.fn(
      new Logger.error('error'),
    );
    callGetShippingMethods(req, res, next);
    expect(res.json).not.toHaveBeenCalled();
  });
});