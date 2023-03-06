"use strict";

/* eslint-disable global-require */
var _require = require('../../index'),
  begin = _require.checkout.begin;
var OrderMgr = require('dw/order/OrderMgr');
var BasketMgr = require('dw/order/BasketMgr');
var ShippingMgr = require('dw/order/ShippingMgr');
var Logger = require('dw/system/Logger');
var Transaction = require('dw/system/Transaction');
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
    },
    session: {
      privacyCache: {
        get: jest.fn(),
        set: jest.fn()
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
  it('should not attempt to restore cart when no order number is cached', function () {
    begin(req, res, jest.fn());
    expect(res.setViewData.mock.calls).toMatchSnapshot();
    expect(OrderMgr.failOrder).not.toHaveBeenCalled();
  });
  it('should not attempt to restore cart when cart is not empty', function () {
    req.session.privacyCache.get.mockImplementationOnce(function () {
      return '12312';
    });
    OrderMgr.status = {
      value: "0"
    };
    begin(req, res, jest.fn());
    expect(Transaction.wrap).not.toHaveBeenCalled();
  });
  it('should successfully restore cart when current cart is empty and order number is in cache', function () {
    req.session.privacyCache.get.mockImplementationOnce(function () {
      return "0";
    });
    BasketMgr.getAllProductLineItems.mockImplementationOnce(function () {
      return [];
    });
    begin(req, res, jest.fn());
    expect(Transaction.wrap).toHaveBeenCalled();
  });
});