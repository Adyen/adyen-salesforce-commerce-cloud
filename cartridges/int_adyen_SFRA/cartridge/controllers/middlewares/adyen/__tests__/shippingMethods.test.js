"use strict";

/* eslint-disable global-require */
var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
var res;
var req;
var next = jest.fn();
var callGetShippingMethods = require('../shippingMethods');
beforeEach(function () {
  jest.clearAllMocks();
  req = {
    querystring: {
      city: 'Amsterdam',
      countryCode: 'NL',
      stateCode: 'AMS',
      shipmentUUID: 'mocked_uuid'
    },
    locale: {
      id: 'nl_NL'
    },
    form: {
      methodID: 'mocked_methodID'
    }
  };
  res = {
    redirect: jest.fn(),
    json: jest.fn()
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Shipping methods', function () {
  it('Should return available shipping methods', function () {
    var Logger = require('../../../../../../../../jest/__mocks__/dw/system/Logger');
    callGetShippingMethods(req, res, next);
    expect(AdyenHelper.getApplicableShippingMethods).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      shippingMethods: ['mocked_shippingMethods']
    });
    expect(Logger.error.mock.calls.length).toBe(0);
  });
  it('Should fail returning available shipping methods', function () {
    var Logger = require('../../../../../../../../jest/__mocks__/dw/system/Logger');
    AdyenHelper.getApplicableShippingMethods = jest.fn(new Logger.error('error'));
    callGetShippingMethods(req, res, next);
    expect(res.json).not.toHaveBeenCalled();
  });
});