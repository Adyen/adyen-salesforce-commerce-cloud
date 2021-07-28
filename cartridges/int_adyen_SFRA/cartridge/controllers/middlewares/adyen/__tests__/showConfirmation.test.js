"use strict";

/* eslint-disable global-require */
var showConfirmation;
var adyenHelper;
var res;
var req;
beforeEach(function () {
  var _require = require('../../index'),
      adyen = _require.adyen;

  adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
  showConfirmation = adyen.showConfirmation;
  jest.clearAllMocks();
  res = {
    redirect: jest.fn(),
    render: jest.fn()
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
  jest.clearAllMocks();
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
  test.each(['Authorised', 'Pending', 'Received'])('should handle successful payment: %p for SFRA6', function (a) {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    adyenHelper.getAdyenSFRA6Compatibility.mockReturnValue(true);
    adyenCheckout.doPaymentDetailsCall.mockImplementation(function () {
      return {
        resultCode: a,
        paymentMethod: [],
        merchantReference: 'mocked_merchantReference'
      };
    });
    showConfirmation(req, res, jest.fn());
    expect(res.render.mock.calls[0][0]).toBe('orderConfirmForm');
  });
  test.each(['Authorised', 'Pending', 'Received'])('should handle successful payment: %p for SFRA5', function (a) {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    adyenHelper.getAdyenSFRA6Compatibility.mockReturnValue(false);

    var URLUtils = require('dw/web/URLUtils');

    adyenCheckout.doPaymentDetailsCall.mockImplementation(function () {
      return {
        resultCode: a,
        paymentMethod: [],
        merchantReference: 'mocked_merchantReference'
      };
    });
    showConfirmation(req, res, jest.fn());
    expect(URLUtils.url.mock.calls[0][0]).toEqual('Order-Confirm');
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