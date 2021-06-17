"use strict";

/* eslint-disable global-require */
var showConfirmation;
var res;
var req;
beforeEach(function () {
  var _require = require('../../index'),
      adyen = _require.adyen;

  showConfirmation = adyen.showConfirmation;
  jest.clearAllMocks();
  res = {
    redirect: jest.fn()
  };
  req = {
    querystring: {
      merchantReference: 'mocked_merchantReference'
    },
    locale: {
      id: 'nl_NL'
    }
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Show Confirmation', function () {
  it('should have redirectResult', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    req.querystring.redirectResult = 'mocked_redirect_result';
    showConfirmation(req, res, jest.fn());
    expect(adyenCheckout.doPaymentDetailsCall.mock.calls).toMatchSnapshot();
  });
  it('should have payload', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    req.querystring.payload = 'mocked_payload_result';
    showConfirmation(req, res, jest.fn());
    expect(adyenCheckout.doPaymentDetailsCall.mock.calls).toMatchSnapshot();
  });
  test.each(['Authorised', 'Pending', 'Received'])('should handle successful payment: %p', function (a) {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    var URLUtils = require('dw/web/URLUtils');

    adyenCheckout.doPaymentDetailsCall.mockImplementation(function () {
      return {
        resultCode: a,
        paymentMethod: [],
        merchantReference: 'mocked_merchantReference'
      };
    });
    showConfirmation(req, res, jest.fn());
    expect(URLUtils.url.mock.calls[0][0]).toBe('Order-Confirm');
  });
  it('should fail if resultCode is Received with Alipay payment', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    var URLUtils = require('dw/web/URLUtils');

    adyenCheckout.doPaymentDetailsCall.mockImplementation(function () {
      return {
        resultCode: 'Received',
        paymentMethod: ['alipay_hk']
      };
    });
    showConfirmation(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
});