"use strict";

/* eslint-disable global-require */
var _require = require('../../index'),
    adyen3ds2 = _require.adyen.adyen3ds2;

var req;
var res;
var next;
beforeEach(function () {
  next = jest.fn();
  req = {
    https: true,
    host: 'mocked_host',
    querystring: {
      resultCode: 'Authorised',
      action: 'mocked_action',
      orderNo: 'mocked_orderNo'
    }
  };
  res = {
    redirect: jest.fn(),
    render: jest.fn()
  };
});
describe('Adyen 3DS2', function () {
  it('should render', function () {
    adyen3ds2(req, res, next);
    expect(res.render.mock.calls).toMatchSnapshot();
  });
  it('should throw', function () {
    var adyenGetOriginKey = require('*/cartridge/scripts/adyenGetOriginKey');

    var Logger = require('dw/system/Logger');

    var URLUtils = require('dw/web/URLUtils');

    adyenGetOriginKey.getOriginKeyFromRequest.mockImplementation(function () {
      throw Error('some_error');
    });
    adyen3ds2(req, res, next);
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
    expect(Logger.error.mock.calls).toMatchSnapshot();
  });
});