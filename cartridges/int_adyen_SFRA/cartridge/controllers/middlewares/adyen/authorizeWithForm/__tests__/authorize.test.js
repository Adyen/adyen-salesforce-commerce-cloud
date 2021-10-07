"use strict";

jest.mock('../order');
jest.mock('../error');
jest.mock('../payment');

var OrderMgr = require('dw/order/OrderMgr');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var handleAuthorize = require('../authorize');

var handleOrderConfirmation = require('../order');

var handleInvalidPayment = require('../payment');

var handleError = require('../error');

var req;
var res;
beforeEach(function () {
  jest.clearAllMocks();
  req = {
    form: {
      MD: 'mocked_md'
    },
    querystring: {
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
describe('Authorize', function () {
  it('should authorize when MD is valid', function () {
    OrderMgr.toArray.mockImplementation(function () {
      return [{
        custom: {
          adyenMD: 'mocked_md'
        }
      }];
    });
    handleAuthorize({
      req: req,
      res: res,
      next: jest.fn()
    });
    expect(handleOrderConfirmation.mock.calls).toMatchSnapshot();
  });
  it('should handle error when MD is invalid', function () {
    req.form.MD = 'invalid_mocked_md';
    handleAuthorize({
      req: req,
      res: res,
      next: jest.fn()
    });
    expect(handleError.mock.calls).toMatchSnapshot();
  });
  it('should handle invalid payment when result code is not Authorised', function () {
    req.form.MD = 'unauthorised_mocked_md';
    OrderMgr.toArray.mockImplementation(function () {
      return [{
        custom: {
          adyenMD: 'unauthorised_mocked_md'
        }
      }];
    });
    handleAuthorize({
      req: req,
      res: res,
      next: jest.fn()
    });
    expect(handleInvalidPayment.mock.calls).toMatchSnapshot();
  });
  it('should handle invalid payment when there is an error while placing an order', function () {
    OrderMgr.toArray.mockImplementation(function () {
      return [{
        custom: {
          adyenMD: 'mocked_md'
        }
      }];
    });
    COHelpers.placeOrder.mockImplementation(function () {
      return {
        error: true
      };
    });
    handleAuthorize({
      req: req,
      res: res,
      next: jest.fn()
    });
    expect(handleInvalidPayment.mock.calls).toMatchSnapshot();
  });
});