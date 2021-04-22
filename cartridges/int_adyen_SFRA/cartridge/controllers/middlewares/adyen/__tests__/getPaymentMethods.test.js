"use strict";

var _BasketMgr = require("../../../../../../../../jest/__mocks__/dw/order/BasketMgr");

/* eslint-disable global-require */
var getPaymentMethods;
var PaymentMgr;
var adyenHelper;
var BasketMgr;
var CustomerMgr;
var req;
var res;
beforeEach(function () {
  var _require = require('../../index'),
      adyen = _require.adyen;

  getPaymentMethods = adyen.getPaymentMethods;
  PaymentMgr = require('dw/order/PaymentMgr');
  adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
  BasketMgr = require('dw/order/BasketMgr');
  CustomerMgr = require('dw/customer/CustomerMgr');
  jest.clearAllMocks();
  res = {
    json: jest.fn()
  };
  req = {
    locale: {
      id: 'NL'
    },
    currentCustomer: {
      profile: {
        customerNo: 'mocked_customerNo'
      }
    }
  };
});
describe('Get Payment Methods', function () {
  it('should get country code', function () {
    getPaymentMethods(req, res, jest.fn());
    expect(BasketMgr.getCountryCode).toHaveBeenCalledTimes(1);
  });
  it('should get customer by customer number', function () {
    getPaymentMethods(req, res, jest.fn());
    expect(CustomerMgr.getCustomerByCustomerNumber).toHaveBeenCalledWith(req.currentCustomer.profile.customerNo);
  });
  it('should call get terminals if isActive', function () {
    getPaymentMethods(req, res, jest.fn());
    expect(PaymentMgr.isActive).toBeCalledTimes(1);
  });
  it('should handle installments when basket has total', function () {
    getPaymentMethods(req, res, jest.fn());
    expect(adyenHelper.getCurrencyValueForApi).toBeCalledTimes(1);
    expect(res.json).toMatchSnapshot();
  });
  it('should handle installments when basket has no total', function () {
    BasketMgr.isAvailable.mockImplementation(function () {
      return false;
    });
    getPaymentMethods(req, res, jest.fn());
    expect(adyenHelper.getCurrencyValueForApi).toBeCalledTimes(0);
    expect(res.json).toMatchSnapshot();
  });
  it('should return response without installments', function () {
    adyenHelper.getCreditCardInstallments.mockImplementation(function () {
      return false;
    });
    getPaymentMethods(req, res, jest.fn());
    expect(res.json).toMatchSnapshot();
  });
  it('should return response without connected terminals', function () {
    PaymentMgr.isActive.mockImplementation(function () {
      return false;
    });
    getPaymentMethods(req, res, jest.fn());
    expect(res.json).toMatchSnapshot();
  });
});