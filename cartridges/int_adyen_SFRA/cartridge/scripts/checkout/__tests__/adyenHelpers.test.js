"use strict";

jest.mock('../utils/index', function () {
  return {
    validatePaymentMethod: jest.fn(function () {
      return jest.fn(function () {
        return true;
      });
    })
  };
});
/* eslint-disable global-require */
var handlePayments;
var order;
var orderNumber;
var currentBasket;
var req;
beforeEach(function () {
  jest.clearAllMocks();
  handlePayments = require('../adyenHelpers').handlePayments;
  currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
  req = {
    geolocation: 'mockedLocation',
    currentCustomer: {
      raw: 'mockedCurrentCustomer'
    }
  };
  order = {
    totalNetPrice: 10,
    paymentInstruments: ['item0', 'item1']
  };
  orderNumber = 'mockedOrderNumber';
});
afterEach(function () {
  jest.resetModules();
});
describe('Adyen Helpers', function () {
  describe('Handle Payments', function () {
    it('should return when totalNetPrice is 0.0', function () {
      order.totalNetPrice = 0.0;
      var handlePaymentsResult = handlePayments(order);
      expect(handlePaymentsResult).toEqual({});
    });
    it('should return error if there are no paymentInstruments', function () {
      order.paymentInstruments = [];
      var handlePaymentsResult = handlePayments(order);
      expect(handlePaymentsResult.error).toBeTruthy();
    });
  });
});