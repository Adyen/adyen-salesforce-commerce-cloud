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
    adyenCheckout.doPaymentsDetailsCall.mockReturnValue({
      invalidRequest: true
    });
    URLUtils.httpHome = jest.fn();
    var order = {
      orderNo: 'mocked_orderNo',
      status: {
        value: 4
      }
    };
    handlePaymentsDetailsCall({}, order, {}, {
      res: res,
      next: jest.fn()
    });

    var Logger = require('dw/system/Logger');

    expect(Logger.error).toHaveBeenCalledWith("Invalid request for order ".concat(order.orderNo));
  });
  it('should handle invalid payment', function () {
    adyenCheckout.doPaymentsDetailsCall.mockReturnValue({
      error: true
    });
    handlePaymentsDetailsCall({}, {
      orderNo: 'mocked_orderNo',
      status: {
        value: 4
      }
    }, {}, {
      res: res,
      next: jest.fn()
    });
    expect(handlePaymentError).toBeCalledTimes(1);
  });
  it('should handle challengeShopper', function () {
    adyenCheckout.doPaymentsDetailsCall.mockReturnValue({
      resultCode: 'ChallengeShopper',
      action: 'mocked_action',
      merchantReference: 'mocked_merchantReference'
    });
    var paymentInstrument = {
      custom: {}
    };
    handlePaymentsDetailsCall({}, {
      status: {
        value: 4
      }
    }, paymentInstrument, {
      res: res,
      next: jest.fn()
    });
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
  it('should place order', function () {
    adyenCheckout.doPaymentsDetailsCall.mockReturnValue({
      resultCode: 'Authorised',
      error: false,
      merchantReference: 'mocked_merchantReference'
    });
    handlePaymentsDetailsCall({}, {
      orderNo: 'mocked_orderNo',
      status: {
        value: 4
      }
    }, {
      custom: {}
    }, {
      res: res,
      next: jest.fn()
    });
    expect(handlePlaceOrder.mock.calls).toMatchSnapshot();
  });
});