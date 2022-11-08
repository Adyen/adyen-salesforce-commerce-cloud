"use strict";

var OrderMgr = require('dw/order/OrderMgr');
var _require = require('../payment'),
  handlePaymentInstruments = _require.handlePaymentInstruments;
var req;
beforeEach(function () {
  req = {
    querystring: {
      redirectResult: 'mocked_redirect_result'
    }
  };
});
describe('Payment', function () {
  it('should handle payment instruments with redirect result', function () {
    var paymentInstruments = OrderMgr.getPaymentInstruments();
    var result = handlePaymentInstruments(paymentInstruments, {
      req: req
    });
    expect(result).toMatchSnapshot();
  });
  it('should handle payment instruments with payload', function () {
    var paymentInstruments = OrderMgr.getPaymentInstruments();
    req.querystring = {
      payload: 'mocked_payload'
    };
    var result = handlePaymentInstruments(paymentInstruments, {
      req: req
    });
    expect(result).toMatchSnapshot();
  });
});