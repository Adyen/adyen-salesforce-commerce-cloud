"use strict";

var handlePaymentAuthorization = require('../payment');

var _require = require('dw/order/OrderMgr'),
    getPaymentInstruments = _require.getPaymentInstruments;

var adyenHelpers = require('*/cartridge/scripts/checkout/adyenHelpers');

var res;
var emit;
var order;
beforeEach(function () {
  jest.clearAllMocks();
  res = {
    json: jest.fn()
  };
  emit = jest.fn();
  order = {
    getPaymentInstruments: getPaymentInstruments,
    orderNo: 'mocked_orderNo'
  };
});
describe('Payment', function () {
  it('should return json with error details when payment is unsuccessful', function () {
    adyenHelpers.handlePayments.mockReturnValue({
      error: true
    });
    var paymentCompleted = handlePaymentAuthorization({}, {
      res: res
    }, emit);
    expect(res.json.mock.calls).toMatchSnapshot();
    expect(paymentCompleted).toBeFalsy();
    expect(emit).toBeCalledWith('route:Complete');
  });
  it('should return 3ds2 json response', function () {
    adyenHelpers.handlePayments.mockReturnValue({
      threeDS2: true,
      resultCode: 'IdentifyShopper',
      action: 'mocked_action'
    });
    var paymentCompleted = handlePaymentAuthorization(order, {
      res: res
    }, emit);
    expect(res.json.mock.calls).toMatchSnapshot();
    expect(paymentCompleted).toBeFalsy();
    expect(emit).toBeCalledWith('route:Complete');
  });
  it('should return 3d json response', function () {
    adyenHelpers.handlePayments.mockReturnValue({
      redirectObject: {
        url: 'mocked_url',
        data: {
          PaReq: 'mocked_PaReq',
          MD: 'mocked_MD'
        }
      },
      signature: 'mocked_signature',
      authorized3d: true,
      orderNo: 'mocked_orderNo'
    });
    var paymentCompleted = handlePaymentAuthorization(order, {
      res: res
    }, emit);
    expect(res.json.mock.calls).toMatchSnapshot();
    expect(paymentCompleted).toBeFalsy();
    expect(emit).toBeCalledWith('route:Complete');
  });
  it('should redirect', function () {
    adyenHelpers.handlePayments.mockReturnValue({
      redirectObject: {
        url: 'mocked_url'
      },
      authorized3d: false,
      signature: 'mocked_signature',
      orderNo: 'mocked_orderNo'
    });
    var paymentCompleted = handlePaymentAuthorization(order, {
      res: res
    }, emit);
    expect(res.json.mock.calls).toMatchSnapshot();
    expect(paymentCompleted).toBeFalsy();
    expect(emit).toBeCalledWith('route:Complete');
  });
  it('should not redirect', function () {
    adyenHelpers.handlePayments.mockReturnValue({
      redirectObject: false,
      threeDS2: false
    });
    var paymentCompleted = handlePaymentAuthorization(order, {
      res: res
    }, emit);
    expect(paymentCompleted).toBeTruthy();
  });
});