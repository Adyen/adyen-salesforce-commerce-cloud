"use strict";

var handlePaymentsDetailsCall = require("../payment");

jest.mock('../errorHandler', function () {
  return {
    handlePaymentError: jest.fn()
  };
});
jest.mock('../order');
var adyenCheckout;
var handlePaymentError;
var URLUtils;
var handlePlaceOrder;
var res;
var req;
beforeEach(function () {
  jest.clearAllMocks();
  res = {
    redirect: jest.fn()
  };
  adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
  handlePaymentError = require('../errorHandler').handlePaymentError;
  URLUtils = require('dw/web/URLUtils');
  handlePlaceOrder = require("../order");
});
describe('Payment', function () {
  it('should handle invalid request', function () {
    adyenCheckout.doPaymentDetailsCall.mockReturnValue({
      invalidRequest: true
    });
    URLUtils.httpHome = jest.fn();
    var order = {
      orderNo: 'mocked_orderNo'
    };
    handlePaymentsDetailsCall({}, order, {}, {
      res: res,
      next: jest.fn()
    });

    var Logger = require('dw/system/Logger');

    expect(Logger.error).toHaveBeenCalledWith("Invalid request for order ".concat(order.orderNo));
  });
  it('should handle invalid payment', function () {
    adyenCheckout.doPaymentDetailsCall.mockReturnValue({
      error: true
    });
    handlePaymentsDetailsCall({}, {}, {}, {
      res: res,
      next: jest.fn()
    });
    expect(handlePaymentError).toBeCalledTimes(1);
  });
  it('should handle challengeShopper', function () {
    adyenCheckout.doPaymentDetailsCall.mockReturnValue({
      resultCode: 'ChallengeShopper',
      action: 'mocked_action',
      merchantReference: 'mocked_merchantReference'
    });
    var paymentInstrument = {
      custom: {}
    };
    handlePaymentsDetailsCall({}, {}, paymentInstrument, {
      res: res,
      next: jest.fn()
    });
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
  it('should place order', function () {
    adyenCheckout.doPaymentDetailsCall.mockReturnValue({
      resultCode: 'Authorised',
      error: false,
      merchantReference: 'mocked_merchantReference'
    });
    handlePaymentsDetailsCall({}, 'mocked_order', {
      custom: {}
    }, {
      res: res,
      next: jest.fn()
    });
    expect(handlePlaceOrder.mock.calls).toMatchSnapshot();
  });
});