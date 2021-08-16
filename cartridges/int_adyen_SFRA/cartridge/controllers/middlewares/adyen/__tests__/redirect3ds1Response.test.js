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
    form: {}
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Redirect 3DS1 Response', function () {
  it('should redirect to PaymentInstruments-List on resultCode Authorised', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    var URLUtils = require('dw/web/URLUtils');

    req.form = {
      MD: 'MOCK_MD',
      PaRes: 'MOCK_PaRes'
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

    req.form = {
      MD: 'MOCK_MD',
      PaRes: 'MOCK_PaRes'
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
  it('should handle invalid form/missing form contents.', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');

    var URLUtils = require('dw/web/URLUtils');

    req.form = null;
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