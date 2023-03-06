"use strict";

/* eslint-disable global-require */
var showConfirmation;
var adyenConfigs;
var res;
var req;
beforeEach(function () {
  var _require = require('../../index'),
    adyen = _require.adyen;
  adyenConfigs = require('*/cartridge/scripts/util/adyenConfigs');
  showConfirmation = adyen.showConfirmation;
  jest.clearAllMocks();
  res = {
    redirect: jest.fn(),
    render: jest.fn()
  };
  req = {
    querystring: {
      merchantReference: "0",
      signature: 'mocked_signature'
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
    var adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    adyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
    req.querystring.redirectResult = 'mocked_redirect_result';
    showConfirmation(req, res, jest.fn());
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls).toMatchSnapshot();
  });
  it('should have payload', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    adyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
    req.querystring.payload = 'mocked_payload_result';
    showConfirmation(req, res, jest.fn());
    expect(adyenCheckout.doPaymentsDetailsCall.mock.calls).toMatchSnapshot();
  });
  it('should return to checkout when signatures mismatch', function () {
    req.querystring.payload = 'mocked_payload_result';
    req.querystring.signature = 'mismatching_signature';
    var URLUtils = require('dw/web/URLUtils');
    var adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    adyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
    showConfirmation(req, res, jest.fn());
    expect(URLUtils.url.mock.calls[0][0]).toEqual('Error-ErrorCode');
  });
  it('should not continue processing when order is not open or failed', function () {
    var URLUtils = require('dw/web/URLUtils');
    req.querystring.merchantReference = 4;
    var adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    adyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
    showConfirmation(req, res, jest.fn());
    expect(URLUtils.url.mock.calls[0][0]).toEqual('Cart-Show');
  });
  test.each(['Authorised', 'Pending', 'Received'])('should handle successful payment: %p for SFRA6', function (a) {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    adyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
    adyenConfigs.getAdyenSFRA6Compatibility.mockReturnValue(true);
    adyenCheckout.doPaymentsDetailsCall.mockImplementation(function () {
      return {
        resultCode: a,
        paymentMethod: [],
        merchantReference: 'mocked_merchantReference'
      };
    });
    req.querystring.redirectResult = 'mocked_redirect_result';
    showConfirmation(req, res, jest.fn());
    expect(res.render.mock.calls[0][0]).toBe('orderConfirmForm');
  });
  test.each(['Authorised', 'Pending', 'Received'])('should handle successful payment: %p for SFRA5', function (a) {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    adyenHelper.getOrderMainPaymentInstrumentType.mockReturnValue('AdyenComponent');
    adyenConfigs.getAdyenSFRA6Compatibility.mockReturnValue(false);
    var URLUtils = require('dw/web/URLUtils');
    adyenCheckout.doPaymentsDetailsCall.mockImplementation(function () {
      return {
        resultCode: a,
        paymentMethod: [],
        merchantReference: 'mocked_merchantReference'
      };
    });
    req.querystring.redirectResult = 'mocked_redirect_result';
    showConfirmation(req, res, jest.fn());
    expect(URLUtils.url.mock.calls[0][0]).toEqual('Order-Confirm');
  });
});