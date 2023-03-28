"use strict";

var req;
var res;
beforeEach(function () {
  jest.clearAllMocks();
});
describe('isNotAdyen', function () {
  it('should return false if payment instrument is Adyen', function () {
    var _jest$requireActual = jest.requireActual('../adyenCheckoutServices'),
      isNotAdyen = _jest$requireActual.isNotAdyen;
    var currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
    expect(isNotAdyen(currentBasket)).toBeFalsy();
  });
  it('should return true if payment instrument is not Adyen', function () {
    var _jest$requireActual2 = jest.requireActual('../adyenCheckoutServices'),
      isNotAdyen = _jest$requireActual2.isNotAdyen;
    var currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
    currentBasket.getPaymentInstruments().toArray.mockReturnValue([{
      paymentMethod: "mockedComponent"
    }]);
    expect(isNotAdyen(currentBasket)).toBeTruthy();
  });
});