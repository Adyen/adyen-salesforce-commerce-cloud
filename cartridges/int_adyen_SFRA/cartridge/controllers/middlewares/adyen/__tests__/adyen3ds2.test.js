"use strict";

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
});