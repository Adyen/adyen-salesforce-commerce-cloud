"use strict";

/* eslint-disable global-require */
var showConfirmationPaymentFromComponent;
var res;
var req;
beforeEach(function () {
  var _require = require('../../index'),
    adyen = _require.adyen;
  showConfirmationPaymentFromComponent = adyen.showConfirmationPaymentFromComponent;
  jest.clearAllMocks();
  res = {
    redirect: jest.fn()
  };
  req = {
    form: {
      additionalDetailsHidden: JSON.stringify({
        paymentData: 'mocked_paymentData',
        details: 'mocked_details'
      }),
      result: null
    },
    locale: {
      id: 'nl_NL'
    }
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Show Confirmation Payment From Component', function () {
  test.each(['Authorised', 'Pending', 'Received'])('should handle successful payment: %p', function (a) {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var URLUtils = require('dw/web/URLUtils');
    adyenCheckout.doPaymentsDetailsCall.mockImplementation(function () {
      return {
        resultCode: a
      };
    });
    showConfirmationPaymentFromComponent(req, res, jest.fn());
    expect(URLUtils.url.mock.calls[0][0]).toBe('Order-Confirm');
  });
  it('should redirect on placeOrder error', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var URLUtils = require('dw/web/URLUtils');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    adyenCheckout.doPaymentsDetailsCall.mockImplementation(function () {
      return {
        resultCode: 'Authorised'
      };
    });
    COHelpers.placeOrder.mockImplementation(function () {
      return {
        error: true
      };
    });
    showConfirmationPaymentFromComponent(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
  it('should redirect on unsuccessful payment', function () {
    var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
    var URLUtils = require('dw/web/URLUtils');
    adyenCheckout.doPaymentsDetailsCall.mockImplementation(function () {
      return {
        resultCode: 'Not_Authorised'
      };
    });
    showConfirmationPaymentFromComponent(req, res, jest.fn());
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
});