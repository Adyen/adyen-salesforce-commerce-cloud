"use strict";

/* eslint-disable global-require */
var paymentFromComponent;
var res;
var req;
beforeEach(function () {
  var _require = require('../../index'),
      adyen = _require.adyen;

  paymentFromComponent = adyen.paymentFromComponent;
  jest.clearAllMocks();
  req = {
    form: {
      data: {
        paymentMethod: {
          type: 'mocked_type'
        }
      }
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
describe('Payment from Component', function () {
  it('should cancel transaction', function () {
    var URLUtils = require('dw/web/URLUtils');

    req.form.data.cancelTransaction = true;
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
  it('should return json response', function () {
    req.form.data = JSON.stringify(req.form.data);
    paymentFromComponent(req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
});