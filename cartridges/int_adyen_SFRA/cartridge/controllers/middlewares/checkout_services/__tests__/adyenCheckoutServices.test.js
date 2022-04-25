"use strict";

/* eslint-disable global-require */
var req;
var res;
beforeEach(function () {
  jest.clearAllMocks();
});
describe('isNotAdyen', function () {
  it('should return false if payment instrument is Adyen', function () {
    var _require$requireActua = require.requireActual('../adyenCheckoutServices'),
        isNotAdyen = _require$requireActua.isNotAdyen;

    var currentBasket = require('dw/order/BasketMgr').getCurrentBasket();

    expect(isNotAdyen(currentBasket)).toBeFalsy();
  });
  it('should return true if payment instrument is not Adyen', function () {
    var _require$requireActua2 = require.requireActual('../adyenCheckoutServices'),
        isNotAdyen = _require$requireActua2.isNotAdyen;

    var currentBasket = require('dw/order/BasketMgr').getCurrentBasket();

    currentBasket.getPaymentInstruments().toArray.mockReturnValue([{
      paymentMethod: "mockedComponent"
    }]);
    expect(isNotAdyen(currentBasket)).toBeTruthy();
  });
});