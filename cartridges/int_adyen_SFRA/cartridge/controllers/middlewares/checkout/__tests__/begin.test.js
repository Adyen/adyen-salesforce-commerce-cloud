"use strict";

/* eslint-disable global-require */
var _require = require('../../index'),
    begin = _require.checkout.begin;

var res;
var req;
beforeEach(function () {
  jest.clearAllMocks();
  req = {
    currentCustomer: {
      raw: {
        isAuthenticated: jest.fn(function () {
          return false;
        })
      }
    }
  };
  res = {
    getViewData: jest.fn(function () {
      return {};
    }),
    setViewData: jest.fn()
  };
});
describe('Begin', function () {
  it('should update saved cards', function () {
    var _require2 = require('*/cartridge/scripts/updateSavedCards'),
        updateSavedCards = _require2.updateSavedCards;

    req.currentCustomer.raw.isAuthenticated.mockImplementation(function () {
      return true;
    });
    begin(req, res, jest.fn());
    expect(updateSavedCards).toBeCalledTimes(1);
  });
  it('should set view data', function () {
    begin(req, res, jest.fn());
    expect(res.setViewData.mock.calls).toMatchSnapshot();
  });
});