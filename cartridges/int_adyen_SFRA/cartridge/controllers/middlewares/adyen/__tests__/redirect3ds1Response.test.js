"use strict";

/* eslint-disable global-require */
var redirect3ds1Response;
var res;
var req;
beforeEach(function () {
  var _require = require('../../index'),
    adyen = _require.adyen;
  redirect3ds1Response = adyen.redirect3ds1Response;
  jest.clearAllMocks();
  res = {
    redirect: jest.fn(),
    json: jest.fn()
  };
  req = {
    httpParameterMap: {
      get: jest.fn(function () {
        return {
          stringValue: 'mockedRedirectresult'
        };
      })
    }
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Redirect 3DS1 Response', function () {
  it('should redirect to PaymentInstruments-List on resultCode Authorised', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var URLUtils = require('dw/web/URLUtils');
    req.querystring = {
      redirectResult: 'mockedRedirectresult'
    };
    adyenCheckout.doPaymentsDetailsCall.mockImplementation(function () {
      return {
        resultCode: 'Authorised',
        pspReference: 'mocked_pspReference'
      };
    });
    redirect3ds1Response(req, res, jest.fn());
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls.length).toEqual(1);
    expect(URLUtils.url.mock.calls[0][0]).toBe('PaymentInstruments-List');
  });
  it('should redirect to PaymentInstruments-AddPayment on other resultCodes', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var URLUtils = require('dw/web/URLUtils');
    req.querystring = {
      redirectResult: 'mockedRedirectresult'
    };
    adyenCheckout.doPaymentsDetailsCall.mockImplementation(function () {
      return {
        resultCode: 'Cancelled',
        pspReference: 'mocked_pspReference'
      };
    });
    redirect3ds1Response(req, res, jest.fn());
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls.length).toEqual(1);
    expect(URLUtils.url.mock.calls[0]).toEqual(['PaymentInstruments-AddPayment', 'isAuthorised', 'false']);
  });
  it('should handle missing querystring contents.', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var URLUtils = require('dw/web/URLUtils');
    req.querystring = null;
    adyenCheckout.doPaymentsDetailsCall.mockImplementation(function () {
      return {
        resultCode: 'Cancelled',
        pspReference: 'mocked_pspReference'
      };
    });
    redirect3ds1Response(req, res, jest.fn());
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls.length).toEqual(1);
  });
});