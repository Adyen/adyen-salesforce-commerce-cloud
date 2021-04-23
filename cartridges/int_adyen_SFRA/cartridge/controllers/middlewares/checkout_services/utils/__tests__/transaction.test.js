"use strict";

jest.mock('../../helpers/index', function () {
  return {
    checkForErrors: jest.fn()
  };
});

var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');

var handleTransaction = require('../transaction');

var _require = require('../../helpers/index'),
    checkForErrors = _require.checkForErrors;

var res;
var req;
var emit;
beforeEach(function () {
  jest.clearAllMocks();
  res = {
    json: jest.fn()
  };
  req = {};
  emit = jest.fn();
});
describe('Transaction', function () {
  it('should fail if current basket has errors', function () {
    checkForErrors.mockReturnValue(true);
    var isSuccessful = handleTransaction({}, {
      res: res,
      req: req
    }, emit);
    expect(isSuccessful).toBeFalsy();
  });
  it('should return json with error details when payment transaction calculation fails', function () {
    checkForErrors.mockReturnValue(false);
    adyenHelpers.validatePayment.mockReturnValue({
      error: false
    });
    COHelpers.calculatePaymentTransaction.mockReturnValue({
      error: true
    });
    var isSuccessful = handleTransaction({}, {
      res: res,
      req: req
    }, emit);
    expect(res.json.mock.calls).toMatchSnapshot();
    expect(isSuccessful).toBeFalsy();
  });
  it('should succeed when payment validation and transaction calculation are successful', function () {
    checkForErrors.mockReturnValue(false);
    adyenHelpers.validatePayment.mockReturnValue({
      error: false
    });
    COHelpers.calculatePaymentTransaction.mockReturnValue({
      error: false
    });
    var isSuccessful = handleTransaction('mockedCurrentBasket', {
      res: res,
      req: req
    }, emit);
    expect(isSuccessful).toBeTruthy();
    expect(basketCalculationHelpers.calculateTotals).toBeCalledWith('mockedCurrentBasket');
  });
});