"use strict";

/* eslint-disable global-require */
var paymentsDetails;
var res;
var req;
beforeEach(function () {
  var _require = require('../../index'),
    adyen = _require.adyen;
  paymentsDetails = adyen.paymentsDetails;
  jest.clearAllMocks();
  res = {
    redirect: jest.fn(),
    json: jest.fn()
  };
  req = {
    body: JSON.stringify({})
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Confirm paymentsDetails', function () {
  it('should fail with invalid stringified JSON body in request', function () {
    var URLUtils = require('dw/web/URLUtils');
    req.body = 'invalid_json_mock';
    paymentsDetails(req, res, jest.fn());
    expect(URLUtils.url.mock.calls[0]).toEqual(['Error-ErrorCode', 'err', 'general']);
  });
  it('should fail when doPaymentsDetailsCall results in an error', function () {
    var URLUtils = require('dw/web/URLUtils');
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    adyenCheckout.doPaymentsDetailsCall.mockImplementationOnce(function () {
      throw new Error('mock_error');
    });
    paymentsDetails(req, res, jest.fn());
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls.length).toEqual(1);
    expect(AdyenHelper.createAdyenCheckoutResponse.mock.calls.length).toEqual(0);
    expect(URLUtils.url.mock.calls[0]).toEqual(['Error-ErrorCode', 'err', 'general']);
  });
  it('should fail when createAdyenCheckoutResponse results in an error', function () {
    var URLUtils = require('dw/web/URLUtils');
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    adyenCheckout.doPaymentsDetailsCall.mockImplementationOnce(function () {
      return {};
    });
    AdyenHelper.createAdyenCheckoutResponse.mockImplementationOnce(function () {
      throw new Error('mock_error');
    });
    paymentsDetails(req, res, jest.fn());
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls.length).toEqual(1);
    expect(AdyenHelper.createAdyenCheckoutResponse.mock.calls.length).toEqual(1);
    expect(URLUtils.url.mock.calls[0]).toEqual(['Error-ErrorCode', 'err', 'general']);
  });
  it('should call paymentDetails request and response handler', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    var URLUtils = require('dw/web/URLUtils');
    adyenCheckout.doPaymentsDetailsCall.mockImplementation(function () {
      return {
        resultCode: 'mocked_resultCode',
        pspReference: 'mocked_pspReference'
      };
    });
    paymentsDetails(req, res, jest.fn());
    expect(URLUtils.url.mock.calls[0][0]).toEqual('Adyen-ShowConfirmation');
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls.length).toEqual(1);
    expect(AdyenHelper.createAdyenCheckoutResponse.mock.calls.length).toEqual(1);
    expect(res.json.mock.calls[0][0]).toEqual({
      isFinal: true,
      isSuccessful: false,
      redirectUrl: "[\"Adyen-ShowConfirmation\",\"merchantReference\",null,\"signature\",\"mocked_signature\",\"orderToken\",null]"
    });
  });
});