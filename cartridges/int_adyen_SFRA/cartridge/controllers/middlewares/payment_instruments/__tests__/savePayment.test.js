"use strict";

/* eslint-disable global-require */
var savePayment;
var res;
var req;
beforeEach(function () {
  var _require = require('../../index'),
      paymentInstruments = _require.paymentInstruments;

  savePayment = paymentInstruments.savePayment;
  jest.clearAllMocks();
  res = {
    json: jest.fn()
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
describe('Save Payment', function () {
  it('should do nothing if adyen secured fields is not enabled', function () {
    var AdyenHelper = require('*/cartridge/scripts/util/adyenHelper');

    var server = require('server');

    AdyenHelper.getAdyenSecuredFieldsEnabled.mockImplementation(function () {
      return false;
    });
    savePayment.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(server.forms.getForm).toBeCalledTimes(0);
  });
  it('should fail if zeroAuth has error', function () {
    var adyenZeroAuth = require('*/cartridge/scripts/adyenZeroAuth');

    adyenZeroAuth.zeroAuthPayment.mockImplementation(function () {
      return {
        error: true
      };
    });
    savePayment.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should fail if resultCode is not Authorised', function () {
    var adyenZeroAuth = require('*/cartridge/scripts/adyenZeroAuth');

    adyenZeroAuth.zeroAuthPayment.mockImplementation(function () {
      return {
        resultCode: 'Not_Authorised'
      };
    });
    savePayment.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
  it('should succeed', function () {
    savePayment.call({
      emit: jest.fn()
    }, req, res, jest.fn());
    expect(res.json.mock.calls).toMatchSnapshot();
  });
});