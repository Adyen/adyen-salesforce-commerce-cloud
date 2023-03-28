"use strict";

/* eslint-disable global-require */
var handle;
var paymentInformation;
var currentBasket;
beforeEach(function () {
  handle = require('../handle');
  jest.clearAllMocks();
  currentBasket = require('dw/order/BasketMgr').getCurrentBasket();
  paymentInformation = {
    isCreditCard: true,
    cardType: 'mockedType',
    cardNumber: 'mockedCardNumber',
    adyenPaymentMethod: 'Credit Card',
    adyenIssuerName: null,
    stateData: '{"paymentMethod": {"type":"scheme"}}',
    creditCardToken: 'mockedStoredCardToken',
    expirationMonth: {
      value: 'mockedMonth'
    },
    expirationYear: {
      value: 'mockedYear'
    }
  };
});
afterEach(function () {
  jest.resetModules();
});
describe('Handle', function () {
  it('should create payment instrument', function () {
    handle(currentBasket, paymentInformation);
    expect(currentBasket.createPaymentInstrument).toBeCalledTimes(1);
  });
  it('should set card details to payment instrument when payment method is credit card', function () {
    var _require = require('dw/order/BasketMgr'),
      setCreditCardToken = _require.setCreditCardToken;
    handle(currentBasket, paymentInformation);
    expect(setCreditCardToken).toBeCalledTimes(1);
  });
});