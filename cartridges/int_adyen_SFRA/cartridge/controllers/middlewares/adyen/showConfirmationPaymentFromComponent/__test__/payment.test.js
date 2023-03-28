"use strict";

var OrderMgr = require('dw/order/OrderMgr');
var URLUtils = require('dw/web/URLUtils');
var adyenCheckout = require('*/cartridge/scripts/adyenCheckout');
var handlePayment = require('../payment');
var res;
var next;
var req;
var order;
beforeEach(function () {
  jest.clearAllMocks();
  req = {
    locale: {
      id: 'mocked_locale'
    }
  };
  res = {
    redirect: jest.fn()
  };
  order = OrderMgr.getOrder();
  next = jest.fn();
});
describe('Payment', function () {
  it('should successfully handle payment', function () {
    adyenCheckout.doPaymentsDetailsCall.mockReturnValue({
      resultCode: 'Authorised'
    });
    var stateData = {
      paymentData: 'mocked_paymentData',
      details: 'mocked_details'
    };
    handlePayment(stateData, order, {
      req: req,
      res: res,
      next: next
    });
    expect(res.redirect.mock.calls).toMatchSnapshot();
  });
  it('should handle payment error when not Authorised', function () {
    adyenCheckout.doPaymentsDetailsCall.mockReturnValue({
      resultCode: 'Not_Authorised'
    });
    var stateData = {
      paymentData: 'mocked_paymentData',
      details: 'mocked_details'
    };
    handlePayment(stateData, order, {
      req: req,
      res: res,
      next: next
    });
    expect(URLUtils.url.mock.calls).toMatchInlineSnapshot("\n      [\n        [\n          \"Checkout-Begin\",\n          \"stage\",\n          \"payment\",\n          \"paymentError\",\n          \"mocked_error.payment.not.valid\",\n        ],\n      ]\n    ");
  });
  it('should handle payment error when theres not state data', function () {
    var stateData = {};
    handlePayment(stateData, order, {
      req: req,
      res: res,
      next: next
    });
    expect(URLUtils.url.mock.calls).toMatchInlineSnapshot("\n      [\n        [\n          \"Checkout-Begin\",\n          \"stage\",\n          \"payment\",\n          \"paymentError\",\n          \"mocked_error.payment.not.valid\",\n        ],\n      ]\n    ");
  });
});