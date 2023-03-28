"use strict";

/* eslint-disable global-require */
var confirm;
var req;
var res;
beforeEach(function () {
  var _require = require('../../index'),
    order = _require.order;
  confirm = order.confirm;
  jest.clearAllMocks();
  res = {
    setViewData: jest.fn(),
    getViewData: jest.fn(function () {
      return {};
    })
  };
  req = {
    querystring: {
      ID: 'mocked_querystring_id',
      token: 'mocked_token'
    }
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Confirm', function () {
  it('should do nothing if giving is not enabled', function () {
    var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    AdyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
    AdyenHelper.getAdyenGivingConfig.mockImplementation(function () {
      return null;
    });
    confirm(req, res, jest.fn());
    expect(res.setViewData).toBeCalledTimes(0);
  });
  it('should do nothing if giving is not available', function () {
    var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    AdyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
    AdyenHelper.isAdyenGivingAvailable.mockImplementation(function () {
      return false;
    });
    confirm(req, res, jest.fn());
    expect(res.setViewData).toBeCalledTimes(0);
  });
  it('should set view data', function () {
    confirm(req, res, jest.fn());
    expect(res.setViewData).toMatchSnapshot();
  });
});