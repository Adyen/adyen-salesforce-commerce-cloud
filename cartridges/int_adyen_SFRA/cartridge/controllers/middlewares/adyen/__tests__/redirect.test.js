"use strict";

/* eslint-disable global-require */
var req;
var res;
var redirect;
beforeEach(function () {
  var _require = require('../../index'),
      adyen = _require.adyen;

  redirect = adyen.redirect;
  jest.clearAllMocks();
  req = {
    querystring: {
      signature: 'some_mocked_url/signature __ ocked_adyen_payment_data',
      merchantReference: 'mocked_merchantReference'
    }
  };
  res = {
    redirect: jest.fn()
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Redirect', function () {
  it('should fail if there is no order and signature', function () {
    var OrderMgr = require('dw/order/OrderMgr');

    var Logger = require('dw/system/Logger');

    OrderMgr.getOrder.mockImplementation(function () {
      return null;
    });
    redirect(req, res, jest.fn());
    expect(Logger.error.mock.calls).toMatchSnapshot();
  });
  it('should fail if signature doesnt match', function () {
    var Logger = require('dw/system/Logger');

    req.querystring.signature = 'mocked_wrong_signature';
    redirect(req, res, jest.fn());
    expect(Logger.error.mock.calls).toMatchSnapshot();
  });
  it('should redirect on valid signature', function () {
    var Logger = require('dw/system/Logger');

    redirect(req, res, jest.fn());
    expect(res.redirect).toBeCalledWith('https://some_mocked_url/signature');
    expect(Logger.error).toBeCalledTimes(0);
  });
});