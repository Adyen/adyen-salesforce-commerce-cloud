"use strict";

var _require = require('../utils'),
    getCountryCode = _require.getCountryCode,
    getConnectedTerminals = _require.getConnectedTerminals;

var CustomerMgr;
var BasketMgr;
var PaymentMgr;
beforeEach(function () {
  jest.clearAllMocks();
  CustomerMgr = require('dw/customer/CustomerMgr');
  BasketMgr = require('dw/order/BasketMgr');
  PaymentMgr = require('dw/order/PaymentMgr');
});
describe('Utils', function () {
  it('should get country code from shipping address', function () {
    var currentBasket = BasketMgr.getCurrentBasket();
    var countryCode = getCountryCode(currentBasket, {
      id: 'NL'
    });
    expect(BasketMgr.getCountryCode).toBeCalledTimes(1);
    expect(countryCode).toEqual('NL');
  });
  it('should get country code from Locale when its not provided in address', function () {
    var currentBasket = {
      getShipments: jest.fn()
    };
    var countryCode = getCountryCode(currentBasket, {
      id: 'NL'
    });
    expect(BasketMgr.getCountryCode).toBeCalledTimes(0);
    expect(countryCode).toEqual('NL');
  });
  it('should get connected Terminals', function () {
    var result = getConnectedTerminals();
    expect(result).toMatchSnapshot();
  });
  it('should return json string when terminal is not active', function () {
    PaymentMgr.isActive.mockImplementation(function () {
      return false;
    });
    var result = getConnectedTerminals();
    expect(result).toEqual('{}');
  });
});