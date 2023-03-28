"use strict";

/* eslint-disable global-require */
var authorize;
var currentBasket;
beforeEach(function () {
  authorize = require('../authorize');
  jest.clearAllMocks();
  currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
});
afterEach(function () {
  jest.resetModules();
});
describe('Authorize', function () {
  it('should return when create payment request fails', function () {
    var _require = require('*/cartridge/scripts/adyenCheckout'),
      createPaymentRequest = _require.createPaymentRequest;
    createPaymentRequest.mockImplementation(function () {
      return {
        error: {}
      };
    });
    var authorizeResult = authorize('15', currentBasket.toArray()[0], 'mockedPaymentProcessor');
    expect(authorizeResult).toMatchSnapshot();
  });
  it('should authorize 3DS payments', function () {
    var _require2 = require('*/cartridge/scripts/adyenCheckout'),
      createPaymentRequest = _require2.createPaymentRequest;
    createPaymentRequest.mockImplementation(function () {
      return {
        resultCode: 'RedirectShopper',
        redirectObject: {
          url: 'mockedUrl',
          data: {
            MD: 'mockedMD'
          }
        }
      };
    });
    var paymentInstrument = currentBasket.toArray()[0];
    var authorizeResult = authorize('15', paymentInstrument, 'mockedPaymentProcessor');
    expect(authorizeResult).toMatchSnapshot();
  });
  it('should authorize 3DS2 payments', function () {
    var _require3 = require('*/cartridge/scripts/adyenCheckout'),
      createPaymentRequest = _require3.createPaymentRequest;
    createPaymentRequest.mockImplementation(function () {
      return {
        threeDS2: 'mockedthreeDS2',
        resultCode: 'mockedresultCode',
        fullResponse: {
          action: 'mockedAction'
        }
      };
    });
    var authorizeResult = authorize('15', currentBasket.toArray()[0], 'mockedPaymentProcessor');
    expect(authorizeResult).toMatchSnapshot();
  });
  it('should authorize redirectShopper payments', function () {
    var _require4 = require('*/cartridge/scripts/adyenCheckout'),
      createPaymentRequest = _require4.createPaymentRequest;
    createPaymentRequest.mockImplementation(function () {
      return {
        resultCode: 'RedirectShopper',
        redirectObject: {
          url: 'mockedURL'
        },
        paymentData: 'mockedpaymentData'
      };
    });
    var paymentInstrument = currentBasket.toArray()[0];
    var authorizeResult = authorize('15', paymentInstrument, 'mockedPaymentProcessor');
    expect(authorizeResult).toMatchSnapshot();
  });
  it('should handle the create payment request decision accept', function () {
    var _require5 = require('*/cartridge/scripts/adyenCheckout'),
      createPaymentRequest = _require5.createPaymentRequest;
    createPaymentRequest.mockImplementation(function () {
      return {
        decision: 'ACCEPT'
      };
    });
    var authorizeResult = authorize('15', currentBasket.toArray()[0], 'mockedPaymentProcessor');
    expect(authorizeResult).toMatchSnapshot();
  });
  it('should handle create payment request decisions other than accept', function () {
    var _require6 = require('*/cartridge/scripts/adyenCheckout'),
      createPaymentRequest = _require6.createPaymentRequest;
    createPaymentRequest.mockImplementation(function () {
      return {
        decision: "DON'T ACCEPT"
      };
    });
    var authorizeResult = authorize('15', currentBasket.toArray()[0], 'mockedPaymentProcessor');
    expect(authorizeResult).toMatchSnapshot();
  });
});