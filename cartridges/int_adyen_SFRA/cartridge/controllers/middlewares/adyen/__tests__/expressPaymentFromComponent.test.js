"use strict";

/* eslint-disable global-require */
var expressPaymentFromComponent;
var res;
var req;
beforeEach(function () {
  var _require = require('../../index'),
    adyen = _require.adyen;
  expressPaymentFromComponent = adyen.expressPaymentFromComponent;
  jest.clearAllMocks();
  req = {
    currentCustomer: {
      profile: {
        customerNo: '12321'
      },
      addressBook: {
        preferredAddress: {
          countryCode: {}
        }
      }
    },
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
describe('Express Payment from Component', function () {
  it('should fail without default address', function () {
    delete req.currentCustomer.addressBook.preferredAddress;
    req.form.data = JSON.stringify(req.form.data);
    expressPaymentFromComponent(req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should cancel transaction', function () {
    req.form.data.cancelTransaction = true;
    req.form.data = JSON.stringify(req.form.data);
    expressPaymentFromComponent(req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should return json response', function () {
    req.form.data = JSON.stringify(req.form.data);
    expressPaymentFromComponent(req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
});