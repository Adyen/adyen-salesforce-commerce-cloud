"use strict";

var handlePaymentMethod = require('../payment');

var req;
var res;
var AdyenHelper;
beforeEach(function () {
  jest.clearAllMocks();
  AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
  req = {
    locale: 'NL',
    currentCustomer: 'curCustomer'
  };
  res = {
    json: jest.fn()
  };
});
describe('Payment', function () {
  it('should return json response with installments', function () {
    AdyenHelper.getCreditCardInstallments.mockReturnValue(true);
    handlePaymentMethod({
      req: req,
      res: res,
      next: jest.fn()
    });
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should return json response without installments', function () {
    AdyenHelper.getCreditCardInstallments.mockReturnValue(false);
    handlePaymentMethod({
      req: req,
      res: res,
      next: jest.fn()
    });
    expect(res.json.mock.calls).toMatchSnapshot();
  });
});