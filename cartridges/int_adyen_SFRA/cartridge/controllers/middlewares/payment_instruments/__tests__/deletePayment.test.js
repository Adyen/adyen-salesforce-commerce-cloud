"use strict";

/* eslint-disable global-require */
var deletePayment;
var res;
var req;
beforeEach(function () {
  var _require = require('../../index'),
    paymentInstruments = _require.paymentInstruments;
  deletePayment = paymentInstruments.deletePayment;
  jest.clearAllMocks();
  res = {
    getViewData: jest.fn(function () {
      return {
        UUID: 'mocked_UUID'
      };
    })
  };
  req = {
    currentCustomer: {
      profile: {
        customerNo: 'mocked_customerNo'
      }
    }
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Delete Payment', function () {
  it('should do nothing if there is no payment', function () {
    var CustomerMgr = require('dw/customer/CustomerMgr');
    res.getViewData.mockImplementation(function () {
      return false;
    });
    deletePayment(req, res, jest.fn());
    expect(CustomerMgr.getCustomerByCustomerNumber).toBeCalledTimes(0);
  });
  it('should not delete payment if theres no token', function () {
    var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');
    var _require2 = require('*/cartridge/scripts/adyenDeleteRecurringPayment'),
      deleteRecurringPayment = _require2.deleteRecurringPayment;
    AdyenHelper.getCardToken.mockImplementation(function () {
      return false;
    });
    deletePayment(req, res, jest.fn());
    expect(deleteRecurringPayment).toBeCalledTimes(0);
  });
  it('should delete recurring payment', function () {
    var _require3 = require('*/cartridge/scripts/adyenDeleteRecurringPayment'),
      deleteRecurringPayment = _require3.deleteRecurringPayment;
    deletePayment(req, res, jest.fn());
    expect(deleteRecurringPayment).toBeCalledTimes(1);
  });
});