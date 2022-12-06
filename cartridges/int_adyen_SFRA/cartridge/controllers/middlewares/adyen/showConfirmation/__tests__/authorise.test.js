"use strict";

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
jest.mock('../payment');
jest.mock('../order');
var handleAuthorised = require('../authorise');
var payment = require('../payment');
var req;
beforeEach(function () {
  jest.clearAllMocks();
  req = {
    locale: {
      id: 'mocked_locale'
    }
  };
});
describe('Authorise', function () {
  it('should handle error', function () {
    COHelpers.placeOrder.mockReturnValue({
      error: true
    });
    var result = {
      resultCode: 'Authorised'
    };
    handleAuthorised({}, result, {}, {});
    expect(payment.handlePaymentError).toBeCalledTimes(1);
  });
  it('should confirm order', function () {
    COHelpers.placeOrder.mockReturnValue({
      error: false
    });
    var result = {
      resultCode: 'Authorised'
    };
    handleAuthorised({}, result, {}, {
      req: req
    });
    expect(payment.handlePaymentError).toBeCalledTimes(0);
  });
});