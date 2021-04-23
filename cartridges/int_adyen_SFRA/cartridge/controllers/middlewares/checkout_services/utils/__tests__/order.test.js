"use strict";

jest.mock('../transaction');
jest.mock('../../helpers/index', function () {
  return {
    hasAdyenPaymentMethod: jest.fn()
  };
});
jest.mock('../payment');
jest.mock('../fraud');

var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

var createOrder = require('../order');

var handlePaymentAuthorization = require('../payment');

var handleFraudDetection = require('../fraud');

var handleTransaction = require('../transaction');

var _require = require('../../helpers/index'),
    hasAdyenPaymentMethod = _require.hasAdyenPaymentMethod;

var req;
var res;
var emit;
var next;
beforeEach(function () {
  jest.clearAllMocks();
  req = {
    locale: {
      id: 'nl_NL'
    },
    session: {
      privacyCache: {
        set: jest.fn()
      }
    },
    currentCustomer: {
      addressBook: true
    }
  };
  res = {
    json: jest.fn()
  };
  emit = jest.fn();
  next = jest.fn();
});
afterEach(function () {
  jest.clearAllMocks();
});
describe('Order', function () {
  it('should go to next middleware if paymentMethod is not Adyen', function () {
    hasAdyenPaymentMethod.mockReturnValue(false);
    createOrder({}, {
      req: req,
      res: res,
      next: next
    }, emit);
    expect(next).toHaveBeenCalledTimes(1);
    expect(handleTransaction).toBeCalledTimes(0);
  });
  it('should return nothing on invalid transaction', function () {
    hasAdyenPaymentMethod.mockReturnValue(true);
    handleTransaction.mockReturnValue(false);
    var result = createOrder({}, {
      req: req,
      res: res,
      next: next
    }, emit);
    expect(result).toBeUndefined();
    expect(next).toHaveBeenCalledTimes(0);
  });
  it('should return json response with error when order is not created', function () {
    COHelpers.createOrder.mockReturnValue(false);
    hasAdyenPaymentMethod.mockReturnValue(true);
    handleTransaction.mockReturnValue(true);
    createOrder({}, {
      req: req,
      res: res,
      next: next
    }, emit);
    expect(res.json.mock.calls).toMatchSnapshot();
    expect(next).toHaveBeenCalledTimes(0);
    expect(emit).toBeCalledWith('route:Complete');
  });
  it('should return nothing when payment is not authorized', function () {
    handlePaymentAuthorization.mockReturnValue(false);
    COHelpers.createOrder.mockReturnValue(true);
    hasAdyenPaymentMethod.mockReturnValue(true);
    handleTransaction.mockReturnValue(true);
    var result = createOrder({}, {
      req: req,
      res: res,
      next: next
    }, emit);
    expect(result).toBeUndefined();
    expect(handleTransaction).toBeCalledTimes(1);
  });
  it('should return nothing when fraud detection is unsuccessful', function () {
    handleFraudDetection.mockReturnValue(false);
    handlePaymentAuthorization.mockReturnValue(true);
    COHelpers.createOrder.mockReturnValue(true);
    hasAdyenPaymentMethod.mockReturnValue(true);
    handleTransaction.mockReturnValue(true);
    var result = createOrder({}, {
      req: req,
      res: res,
      next: next
    }, emit);
    expect(result).toBeUndefined();
    expect(handlePaymentAuthorization).toBeCalledTimes(1);
  });
  it('should return nothing when there is an error while placing the order', function () {
    COHelpers.placeOrder.mockReturnValue({
      error: true
    });
    handleFraudDetection.mockReturnValue(true);
    handlePaymentAuthorization.mockReturnValue(true);
    COHelpers.createOrder.mockReturnValue(true);
    hasAdyenPaymentMethod.mockReturnValue(true);
    handleTransaction.mockReturnValue(true);
    var result = createOrder({}, {
      req: req,
      res: res,
      next: next
    }, emit);
    expect(result).toBeUndefined();
    expect(handleFraudDetection).toBeCalledTimes(1);
  });
  it('should confirm order', function () {
    COHelpers.placeOrder.mockReturnValue({
      error: false
    });
    handleFraudDetection.mockReturnValue(true);
    handlePaymentAuthorization.mockReturnValue(true);
    COHelpers.createOrder.mockReturnValue({
      orderNo: 1,
      orderToken: 'token'
    });
    hasAdyenPaymentMethod.mockReturnValue(true);
    handleTransaction.mockReturnValue(true);
    createOrder({}, {
      req: req,
      res: res,
      next: next
    }, emit);
    expect(res.json.mock.calls).toMatchSnapshot();
  });
});