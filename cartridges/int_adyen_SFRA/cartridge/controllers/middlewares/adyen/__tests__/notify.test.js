"use strict";

/* eslint-disable global-require */

var req;
var res;
var notify;
beforeEach(function () {
  var _require = require('../../index'),
    adyen = _require.adyen;
  notify = adyen.notify;
  jest.clearAllMocks();
  req = {};
  res = {
    render: jest.fn()
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Notify', function () {
  it('should render error when status is falsy', function () {
    var checkAuth = require('*/cartridge/scripts/checkNotificationAuth');
    checkAuth.check.mockImplementation(function () {
      return false;
    });
    notify(req, res, jest.fn());
    expect(res.render).toHaveBeenCalledWith('/adyen/error');
  });
  it('should render notify when notification result is successful', function () {
    var handleNotify = require('*/cartridge/scripts/handleNotify');
    handleNotify.notify.mockImplementation(function () {
      return {
        success: true
      };
    });
    notify(req, res, jest.fn());
    expect(res.render).toHaveBeenCalledWith('/notify');
  });
  it('should render notifyError when notification result is not successful', function () {
    var handleNotify = require('*/cartridge/scripts/handleNotify');
    handleNotify.notify.mockImplementation(function () {
      return {
        success: false,
        errorMessage: 'mocked_error_message'
      };
    });
    notify(req, res, jest.fn());
    expect(res.render.mock.calls).toMatchSnapshot();
  });
});