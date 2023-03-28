"use strict";

/* eslint-disable global-require */
var getPayments;
var order;
var orderNumber;
var setTransactionID;
beforeEach(function () {
  getPayments = require('../getPayments');
  setTransactionID = jest.fn(function () {
    return true;
  });
  var toArray = jest.fn(function () {
    return [{
      ID: 'mockedPaymentInstrument',
      paymentTransaction: {
        setTransactionID: setTransactionID
      }
    }];
  });
  order = {
    totalNetPrice: 10,
    paymentInstruments: {
      toArray: toArray
    }
  };
  orderNumber = 'mockedOrderNumber';
  jest.clearAllMocks();
});
afterEach(function () {
  jest.resetModules();
});
describe('Get Payments', function () {
  it('should setTransactionID when there is no payment processor', function () {
    var _require = require('dw/order/PaymentMgr'),
      getPaymentMethod = _require.getPaymentMethod;
    getPaymentMethod.mockImplementation(function () {
      return {
        paymentProcessor: null
      };
    });
    getPayments(order, orderNumber);
    expect(setTransactionID).toBeCalledTimes(1);
  });
  it('should return error when authorization result returns an error', function () {
    var _require2 = require('dw/system/HookMgr'),
      callHook = _require2.callHook;
    callHook.mockImplementation(function () {
      return {
        error: true
      };
    });
    var handlePaymentsResult = getPayments(order, orderNumber);
    expect(handlePaymentsResult.error).toBeTruthy();
  });
  it('should not return error when authorization result does not return an error', function () {
    var handlePaymentsResult = getPayments(order, orderNumber);
    expect(handlePaymentsResult.error).toBeFalsy();
  });
});