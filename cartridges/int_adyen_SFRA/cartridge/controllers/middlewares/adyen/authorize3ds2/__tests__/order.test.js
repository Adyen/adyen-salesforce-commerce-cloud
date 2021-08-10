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
var adyenHelper;
beforeEach(function () {
  jest.clearAllMocks();
  req = {
    locale: {
      id: 'mocked_locale_id'
    }
  };
  res = {
    redirect: jest.fn(),
    render: jest.fn()
  };
  handlePlaceOrder = require("../order");
  COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
  adyenHelper = require('*/cartridge/scripts/util/adyenHelper');
});
describe('Order', function () {
  it('should handle place order error', function () {
    var _require = require('../errorHandler'),
        handlePlaceOrderError = _require.handlePlaceOrderError;

    adyenHelper.getAdyenSFRA6Compatibility.mockReturnValue(true);
    COHelpers.placeOrder.mockReturnValue({
      error: true
    });
    handlePlaceOrder();
    expect(handlePlaceOrderError).toBeCalledTimes(1);
  });
  it('should handle place order error', function () {
    var OrderMgr = require('dw/order/OrderMgr');

    adyenHelper.getAdyenSFRA6Compatibility.mockReturnValue(true);
    var order = OrderMgr.getOrder(session.privacy.orderNo);
    var paymentInstrument = order.getPaymentInstruments()[0];
    handlePlaceOrder(paymentInstrument, order, {}, {
      req: req,
      res: res,
      next: jest.fn()
    });
    expect(res.render.mock.calls).toMatchSnapshot();
  });
});