"use strict";

/* eslint-disable global-require */

var req;
var res;
var placeOrder = require('../placeOrder');
beforeEach(function () {
  var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
  hooksHelper.mockImplementation(function () {
    return {};
  });
  jest.clearAllMocks();
  res = {
    json: jest.fn()
  };
  req = {
    session: {
      privacyCache: {
        get: jest.fn(),
        set: jest.fn()
      }
    },
    currentCustomer: {
      addressBook: true
    },
    locale: {
      id: 'nl_NL'
    }
  };
});
describe('Checkout Services', function () {
  it('should go to next middleware if payment instrument is not Adyen', function () {
    var _require = require('*/cartridge/controllers/middlewares/checkout_services/adyenCheckoutServices'),
      isNotAdyen = _require.isNotAdyen;
    isNotAdyen.mockImplementationOnce(jest.fn(function () {
      return true;
    }));
    var _require2 = require('*/cartridge/scripts/helpers/basketValidationHelpers'),
      validateProducts = _require2.validateProducts;
    var next = jest.fn();
    placeOrder(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);
    expect(validateProducts).toHaveBeenCalledTimes(0);
  });
  it('should process payment if action is valid', function () {
    var _require3 = require('*/cartridge/controllers/middlewares/checkout_services/adyenCheckoutServices'),
      processPayment = _require3.processPayment;
    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(processPayment).toHaveBeenCalledTimes(1);
  });
  it('should not process payment and return json response at end of file when there is no action', function () {
    var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    adyenHelpers.handlePayments.mockImplementationOnce(function () {
      return {
        error: false
      };
    });
    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(COHelpers.sendConfirmationEmail).toBeCalledTimes(1);
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should attempt to cache orderNumber after order creation', function () {
    placeOrder.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(req.session.privacyCache.set.mock.calls[0][0]).toBe('currentOrderNumber');
    expect(req.session.privacyCache.set.mock.calls[0][1]).toBe('mocked_orderNo');
    expect(req.session.privacyCache.set.mock.calls[1][0]).toBe('currentOrderToken');
    expect(req.session.privacyCache.set.mock.calls[1][1]).toBe('mocked_orderToken');
  });
});