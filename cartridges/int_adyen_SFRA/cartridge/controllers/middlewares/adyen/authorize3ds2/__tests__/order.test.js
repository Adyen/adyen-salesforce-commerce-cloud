"use strict";

jest.mock('../errorHandler', function () {
  return {
    handlePlaceOrderError: jest.fn()
  };
});
var handlePlaceOrder;
var COHelpers;
var req;
var res;
beforeEach(function () {
  jest.clearAllMocks();
  req = {
    locale: {
      id: 'mocked_locale_id'
    }
  };
  res = {
    redirect: jest.fn()
  };
  handlePlaceOrder = require("../order");
  COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
});
describe('Order', function () {
  it('should handle place order error', function () {
    var _require = require('../errorHandler'),
        handlePlaceOrderError = _require.handlePlaceOrderError;

    COHelpers.placeOrder.mockReturnValue({
      error: true
    });
    handlePlaceOrder();
    expect(handlePlaceOrderError).toBeCalledTimes(1);
  });
  it('should handle place order error', function () {
    COHelpers.placeOrder.mockReturnValue({
      error: false
    });

    var OrderMgr = require('dw/order/OrderMgr');

    var URLUtils = require('dw/web/URLUtils');

    var order = OrderMgr.getOrder(session.privacy.orderNo);
    var paymentInstrument = order.getPaymentInstruments()[0];
    handlePlaceOrder(paymentInstrument, order, {}, {
      req: req,
      res: res,
      next: jest.fn()
    });
    expect(URLUtils.url.mock.calls).toMatchSnapshot();
  });
});